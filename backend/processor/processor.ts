import { Express } from "express";
import { Server } from "socket.io";
import Database from "../db";

import FileSystem from "./handlers/filesystem";
import Stremio from "./handlers/stremio";
import qBittorrent from "./handlers/qbittorrent";
import axios from "axios";
import Plex from "./handlers/plex";

class Processor {
    private db: Database;
    private io: Server;
    private app: Express;
    private config: any;

    private FileSystem: FileSystem;
    private Stremio: Stremio;
    private qBittorrent: qBittorrent;
    private Plex: Plex;

    constructor(db: Database, io: Server, app: Express, config: any) {
        this.db = db;
        this.io = io;
        this.app = app;
        this.config = config;

        this.FileSystem = new FileSystem(this.config.stremio.stremioCachePath, this.config.user.userSaveFolder, this.config.plex.plexStoragePath);

        this.Stremio = new Stremio(
            this.config.stremio.stremioAppPath,
            this.config.stremio.stremioAppHost, 
            this.config.stremio.stremioCachePath, 
            this.config.stremio.checkTimeout,
            this.config.stremio.checkRetries,
            this.FileSystem,
            this.app,
            this.io,
            this.db,
        );
        this.Stremio.buildEndpoints();

        this.qBittorrent = new qBittorrent(
            this.config.qbittorrent.qBittorrentAppHost, 
            this.config.qbittorrent.qbittorrentApi, 
            this.config.qbittorrent.qbittorrentCredentials, 
            this.app,
            this.io,
        );
        this.qBittorrent.buildEndpoints();

        this.Plex = new Plex(
            this.config.plex.plexAppHost,
            this.config.plex.plexStoragePath,
            this.config.plex.plexToken,
            this.config.plex.plexMetadataCommand,
            this.app,
            this.db,
            this.io,
            this.FileSystem,
        );
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

        this.app.get('/api/configuration', (req, res) => {
            res.send({ 
                stremioCachePath: this.config.stremio.stremioCachePath, 
                stremioAppHost: this.config.stremio.stremioAppHost,
                qbittorrentAppHost: this.config.qbittorrent.qBittorrentAppHost,
                vpnAppPath: '',
                userSaveFolder: this.config.user.userSaveFolder,
                stremioCheckTimeout: this.config.stremio.checkTimeout,
                stremioCheckRetries: this.config.stremio.checkRetries,
                plexAppHost: this.config.plex.plexAppHost,
                plexStorageHost: this.config.plex.plexStorageHost,
                plexStoragePath: this.config.plex.plexStoragePath,
            });
        });

        this.app.post('/api/configuration', async (req, res) => {
            const { stremioCachePath, stremioAppHost, qbittorrentAppHost, userSaveFolder, stremioCheckTimeout, stremioCheckRetries } = req.body;
            this.config.stremio.stremioCachePath = stremioCachePath;
            this.config.stremio.stremioAppHost = stremioAppHost;
            this.config.qbittorrent.qBittorrentAppHost = qbittorrentAppHost;
            this.config.user.userSaveFolder = userSaveFolder;
            this.config.stremio.checkTimeout = stremioCheckTimeout;
            this.config.stremio.checkRetries = stremioCheckRetries;
            this.FileSystem.updateConfig(stremioCachePath, userSaveFolder);
            this.Stremio.updateConfig(stremioAppHost, stremioCachePath, stremioCheckTimeout, stremioCheckRetries, this.FileSystem);
            this.qBittorrent.updateConfig(qbittorrentAppHost);
            await this.db.save('config', this.config);
            res.send({ message: 'Configuration saved' });
        });

        this.app.get('/api/configuration/storage-path', (req, res) => {
            res.send({ storagePath: this.config.plex.plexStoragePath });
        });

        this.app.get('/api/configuration/storage-path/:id', (req, res) => {
            const id = Number(req.params.id);
            
            if (id === undefined || isNaN(id)) {
                res.status(400).send({ message: 'Id is required' });
                return;
            } 

            if (!this.config.plex.plexStoragePath[id]) {
                res.status(404).send({ message: 'Storage path not found' });
                return;
            }

            res.send({ storagePath: this.config.plex.plexStoragePath[id] });
        });


        this.app.post('/api/configuration/storage-path', async (req, res) => {
            const { key, path, plexPath, title } = req.body;

            if (!path) {
                res.status(400).send({ message: 'Path is required' });
                return;
            }

            if (!plexPath) {
                res.status(400).send({ message: 'Plex storage path is required' });
                return;
            }

            this.config.plex.plexStoragePath.push({ key, path, plexPath, title });
            this.Plex.updateConfig(this.config.plex.plexAppHost, this.config.plex.plexStoragePath);
            this.config.plex.plexPath = this.config.plex.plexStoragePath;
            await this.db.save('config', this.config);
            res.send({ message: 'Storage path saved' });
        });

        this.app.put('/api/configuration/storage-path', async (req, res) => {
            const { id, key, path, plexPath, title } = req.body;

            if (!path) {
                res.status(400).send({ message: 'Path is required' });
                return;
            }

            if (!plexPath) {
                res.status(400).send({ message: 'Plex storage path is required' });
                return;
            }

            this.config.plex.plexStoragePath[id] = { key, path, plexPath, title };
            this.Plex.updateConfig(this.config.plex.plexAppHost, this.config.plex.plexStoragePath);
            this.config.plex.plexPath = this.config.plex.plexStoragePath;
            await this.db.save('config', this.config);
            res.send({ message: 'Storage path saved' });
        });

        this.app.delete('/api/configuration/storage-path/:id', async (req, res) => {
            const id = Number(req.params.id);

            if (id === undefined || isNaN(id)) {
                res.status(400).send({ message: 'Id is required' });
                return;
            } 

            if (!this.config.plex.plexStoragePath[id]) {
                res.status(404).send({ message: 'Storage path not found' });
                return;
            }

            this.config.plex.plexStoragePath.splice(id, 1);
            this.Plex.updateConfig(this.config.plex.plexAppHost, this.config.plex.plexStoragePath);
            await this.db.save('config', this.config);
            res.send({ message: 'Storage path deleted' });
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

        this.app.post('/api/folders/:folder/:file/copy', async (req, res) => {
            const folder = req.params.folder;
            const file = req.params.file;
            const dest = req.body.dest;

            // clean copy with stremio file name
            const copied = this.FileSystem.copyFile(folder, file, dest);
            if (!copied) {
                res.status(500).send({ message: 'Unable to copy folder' });
                return;
            }
            const saved = await this.db.get(folder);
            let folderSavedInfo = JSON.parse(saved);
            folderSavedInfo['stremio']['stremioCopied'] = true;
            await this.db.save(folder, folderSavedInfo);
            res.send({ message: 'Folder copied' });
        });
        
        this.app.get('/api/watch', async (req, res) => {
            const folder = req.query.folder as string;
            const title = req.query.title as string;

            const started = this.FileSystem.startVideo(title);

            if (!started) {
                res.status(500).send({ message: 'Unable to start video' });
                return;
            }

            res.send({ message: 'Video started'});
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

        const processed = await this.db.get(folder);
        const folderSavedInfo = JSON.parse(processed);

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
                    'qbittorrentDownloaded': false, 
                    'qbittorrentState': null
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
            throw new Error(error.message);
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
            
            if (response.data.isp === 'NordVPN') {
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