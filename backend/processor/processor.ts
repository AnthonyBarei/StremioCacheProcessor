import { Express } from "express";
import { Server } from "socket.io";
import Database from "../db";

import FileSystem from "./handlers/filesystem/filesystem";
import Stremio from "./handlers/stremio/stremio";
import qBittorrent from "./handlers/qbittorrent/qbittorrent";
import axios from "axios";
import Plex from "./handlers/plex/plex";
import Configuration from "./handlers/configuration";

class Processor {
    private db: Database;
    private io: Server;
    private app: Express;
    private config: any;

    private Configuration: Configuration;
    private FileSystem: FileSystem;
    private Stremio: Stremio;
    private qBittorrent: qBittorrent;
    private Plex: Plex;

    constructor(db: Database, io: Server, app: Express, config: any) {
        this.db = db;
        this.io = io;
        this.app = app;
        this.config = config;

        this.Configuration = new Configuration(this.config, this.app, this.db);
        this.Configuration.buildEndpoints();

        this.FileSystem = new FileSystem(this.Configuration, this.io);

        this.Stremio = new Stremio(this.Configuration, this.FileSystem, this.app, this.io, this.db);
        this.Stremio.buildEndpoints();

        this.qBittorrent = new qBittorrent(this.Configuration, this.FileSystem, this.app, this.io, this.db);
        this.qBittorrent.buildEndpoints();

        this.Plex = new Plex(this.Configuration, this.FileSystem, this.app, this.io, this.db);
        this.Plex.buildEndpoints();

        this.buildEndpoints();
    }

    public async run(): Promise<void> {
        this.FileSystem.watchdog(this.processFolder.bind(this)); // Watch for new folders
    }

    private buildEndpoints(): void {
        this.app.post('/api/folders', async (req, res) => {            
            const cacheFolders = this.FileSystem.getCacheFolders();

            for (const folder of cacheFolders) {
                try {
                    await this.processFolder(folder);
                } catch (error: any) {
                    console.log(error.message);
                    break;
                }
            }

            res.send({ success: true });
        });

        this.app.get('/api/connection-safe', async (req, res) => {            
            const isConnected = await this.verifySafeConnection();            
            res.send({ safe: isConnected });
        });

        this.app.delete('/api/folders/:id', async (req, res) => {
            const folder = req.params.id;

            const folderExists = this.FileSystem.folderExists(folder);
            if (!folderExists) {
                res.send({ message: 'Folder does not exist' });
                return;
            }
            
            const deleted = this.FileSystem.deleteFolder(folder);
            if (!deleted) {
                res.status(500).send({ message: 'Unable to delete folder' });
                return;
            }
            await this.db.delete(folder);
            res.send({ message: 'Folder deleted' });
        });

        this.app.post('/api/association', async (req, res) => {
            const folder = req.body.id;
            const videoId = req.body.videoId.split(':')[0]
            const season = req.body.videoId.split(':')[1];
            const episode = req.body.videoId.split(':')[2];
            let url = '';

            if (season && episode) {
                url = `https://v3-cinemeta.strem.io/meta/series/${videoId}.json`;
            } else {
                url = `https://v3-cinemeta.strem.io/meta/movie/${videoId}.json`;
            }
            
            axios.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                },
            }).then(async response => {
                const metadata = response.data.meta;
                const folderSavedInfo = await this.db.get(folder, true);
                folderSavedInfo['selectedMetadata'] = metadata;
                
                if (season && episode) {
                    folderSavedInfo['selectedMetadata']['season'] = season;
                    folderSavedInfo['selectedMetadata']['episode'] = episode;
                    folderSavedInfo['selectedMetadata']['type'] = 'series';
                }

                await this.db.save(folder, folderSavedInfo);

                res.send({ message: 'Association saved', meta: metadata });
            }).catch(error => {
                res.status(500).send({ message: error.message });
            });
        });

        this.app.patch('/api/type', async (req, res) => {
            const folder = req.body.folder;
            const type = req.body.type;
            const folderSavedInfo = await this.db.get(folder, true);
            if (folderSavedInfo['selectedMetadata']) {
                folderSavedInfo['selectedMetadata']['type'] = type;
            } else {
                folderSavedInfo['meta']['type'] = type;
            }
            folderSavedInfo['destination'] = this.FileSystem.joinPath(this.Configuration.config.user.userSaveFolder + '/' + type.charAt(0).toUpperCase() + type.slice(1));
            await this.db.save(folder, folderSavedInfo);
            this.io.emit('meta', { id: folder, ...folderSavedInfo });
            res.send({ message: 'Type saved' });
        });
    }

    private async processFolder(folder: string): Promise<void> {
        const folderExists = this.FileSystem.folderExists(folder);

        if (!folderExists) {
            console.log(`Folder ${folder} does not exist`);
            return;
        }

        // get folder date
        const folderDate = this.FileSystem.getFolderDate(folder);
        // if folder is older than 4 day, delete it
        if (folderDate && Date.now() - folderDate.getTime() > 86400 * 4 * 1000) {
            console.log(`Deleting folder ${folder}`);
            this.FileSystem.deleteFolder(folder);
            await this.db.delete(folder);
            return;
        }

        const folderSavedInfo = await this.db.get(folder, true);

        if (folderSavedInfo && folderSavedInfo['processed'] === true) {
            console.log(`Folder ${folder} has already been processed`);
            this.io.emit('meta', { id: folder, ...folderSavedInfo });
            return;
        }

        console.log(`Folder ${folder} has not been processed`);

        try {
            let meta = folderSavedInfo && folderSavedInfo['meta'] ? folderSavedInfo['meta'] : null;

            if (!meta) {
                try {
                    meta = await this.Stremio.getMetaInfo(folder);
                    if (!meta) {
                        console.log(`Folder ${folder} has no meta`);
                        return;
                    }
                } catch (error: any) {
                    throw new Error(error.message);
                }
            }

            const stremioState = await this.Stremio.processMetaInfo(folder, meta);
            const metadata = {
                'processed': true, 
                'meta': meta, 
                'stremio': {
                    'stremioState': stremioState, 
                    'stremioDownloaded': false, 
                    'stremioCopied': false
                }, 
                'qbittorrent': {
                    'qbittorrentAdded': false,
                    'qbittorrentDownloaded': false,
                    'qbittorrentDownloading': false,
                    'qbittorrentProgress': 0,
                    'qbittorrentMediaPath': null,
                },
                'plex': {
                    'plexCopied': false,
                },
            };

            // Mark the folder as processed
            await this.db.save(folder, metadata);
            // send meta to client with id
            this.io.emit('meta', { id: folder, ...metadata });
        } catch (error: any) {
            // throw new Error(error.message);
            console.log(error.message);
        }

        return;
    }

    private async verifySafeConnection(): Promise<boolean> {
        try {
            const response = await axios.get('https://nordvpn.com/wp-admin/admin-ajax.php?action=get_user_info_data', {
                headers: {
                    Referer: 'https://nordvpn.com/what-is-my-ip/',
                },
            });
            
            if (response.data.isp === 'NordVPN' || response.data.isp === 'Hydra Communications') {
                console.log('NordVPN is connected');
                return true;
            } else {
                console.log('NordVPN is not connected');
                return false;
            }
        } catch (error) {
            console.error(error);
            return false;
        }
    };
}

export default Processor;