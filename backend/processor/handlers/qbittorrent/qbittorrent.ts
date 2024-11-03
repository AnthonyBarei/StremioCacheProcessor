import qBittorrentClient from './qbittorrent-client';
import axios from 'axios';
import FileSystem from '../filesystem/filesystem';
import Configuration from '../configuration';
import { Express } from 'express';
import { Server } from 'socket.io';
import Database from '../../../db';

class qBittorrent extends qBittorrentClient {
    private FileSystem: FileSystem;
    private app: Express;
    private io: Server;
    private db: Database;
    private trackers: string[] = [];
    private addedTorrents = new Set<string>();
    private checkingTorrents = new Set<string>();
    private debugTorrents = new Set<string>();
    
    constructor(Configuration: Configuration, FileSystem: FileSystem, app: Express, io: Server, db: Database) {
        super(Configuration);
        this.FileSystem = FileSystem;
        this.app = app;
        this.io = io;
        this.db = db;
        this.addedTorrents = new Set<string>();
        this.checkingTorrents = new Set<string>();
        this.debugTorrents = new Set<string>();
        this.connection();
        this.getLastTrackers();
    };

    public buildEndpoints(): void {
        this.app.get('/api/torrent/connected', (req: any, res: any) => {
            this.connection();
            res.status(200).send({ connected: this.connected });
        });
        this.app.get('/api/torrent/files', this.getTorrentFiles);
        this.app.get('/api/torrent/properties', this.getTorrentProperties);
        this.app.get('/api/torrent/status', this.getTorrentStatus);
        this.app.post('/api/torrent/trackers', this.AddTorrentTrackers);

        this.app.get('/api/torrent/watch', async (req: any, res: any) => {
            const hash = req.query.hash;
            if (!hash) return res.status(400).send({ error: 'Missing hash parameter' });
            const info = await this.db.get(hash, true);
            if (info && info.qbittorrent && info.qbittorrent.qbittorrentMediaPath) {
                const mediaFile = this.FileSystem.getFirstMediaFile(info.qbittorrent.qbittorrentMediaPath)                
                const videoStarted = this.FileSystem.startVideoHardPath(mediaFile);
                res.status(200).send({ result: videoStarted });
            } else {
                res.status(404).send({ error: 'Torrent path not found.' });
            }
        });

        this.io.on('connection', (socket: any) => {
            console.log('user connected on qbittorrent');

            socket.on('torrent-add', (response: any) => {     
                if (!this.connected) {
                    this.io.emit('torrent-error', { hash: response.hash, message: 'qBittorrent is not connected.' });
                    return;          
                }

                if (this.addedTorrents.has(response.hash)) {
                    this.io.emit('torrent-error', { hash: response.hash, message: 'Torrent already added.' });
                    return;
                }

                this.addedTorrents.add(response.hash);
                this.checkingTorrents.add(response.hash);
                this.addTorrent(response.hash);
            });

            socket.on('set-torrent-fileprio', (response: any) => {
                this.setFilePriority(response.hash, response.fileIndices, response.priority);
            });

            socket.on('torrent-debug', (response: any) => {
                if (this.debugTorrents.has(response.hash)) {
                    this.io.emit('torrent-error', { hash: response.hash, message: 'Torrent already debugging.' });
                    return;
                }
                this.debugTorrents.add(response.hash);
                this.debugTorrent(response.hash);
            });

            socket.on('torrent-check', async (response: any) => {
                if (this.checkingTorrents.has(response.hash)) {
                    this.io.emit('torrent-error', { hash: response.hash, message: 'Torrent already checking.' });
                    return;
                }

                this.checkingTorrents.add(response.hash);

                try {
                    const downloaded = await this.waitFileDownloaded(response.hash);
                    if (downloaded) {
                        this.io.emit('torrent-downloaded', { hash: response.hash, message: 'Torrent downloaded.' });
                    }
                } catch (error: any) {
                    this.io.emit('torrent-error', { hash: response.hash, message: error.message });
                } finally {
                    this.checkingTorrents.delete(response.hash);
                }
            });

            socket.on('torrent-delete', (response: {hash: string, removeFiles: boolean}) => {
                this.deleteTorrent(response.hash, response.removeFiles);
            });

            socket.on('disconnect', () => {
              console.log('user disconnected from qbittorrent');
            });
        });
    };

    private getLastTrackers = async () => {
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: 'https://ngosang.github.io/trackerslist/trackers_all.txt',
            headers: { 
                'Content-Type': 'application/json'
            },
        };
            
        axios.request(config).then((response) => {
            const trackers = response.data.split('\n').filter(Boolean); // split by newline and remove empty strings
            this.trackers = trackers;
        }).catch((error) => {
            console.log(error);
        });
    };

    private getTorrentFiles = async (req: any, res: any) => {
        const hash = req.query.hash;

        if (!hash) return res.status(400).send({ error: 'Missing hash parameter' });
              
        this.getTorrentFilesApi(hash).then((response: any) => {
            res.send(response);
        }).catch((error: any) => {
            res.status(500).send(error);
        });
    };

    private addTorrent = async (hash: string) => {
        const magnet = 'magnet:?xt=urn:btih:' + hash;
        const category = 'SCPDownload'; // personnalize
        
        try {
            // api add torrent
            await this.AddTorrentApi(magnet, category);
            this.io.emit('torrent-added', { hash, message: 'Torrent added.'});
            await this.updateDBTorrentState(hash, {
                qbittorrentAdded: true,
            });

            await this.resumeTorrentApi(hash);

            const torrentInfo = await this.getTorrentInfo(category, hash);
            this.io.emit('torrent-started', { torrentInfo, hash, message: 'Torrent download started.'});
            
            // show torrent files 
            const filesResponse = await this.getTorrentFilesApi(hash);
            if (filesResponse && filesResponse.length === 0) throw new Error("Torrent has no files.");
            this.io.emit('torrent-files', {hash, files: filesResponse, message: 'Torrent files found.' });
            
            // pause torrent
            await this.pauseTorrentApi(torrentInfo.hash);            
            this.io.emit('torrent-paused', { hash, message: 'Torrent download paused.'});
        } catch (error: any) {
            this.io.emit('torrent-error', { hash, message: error.message })
        } finally {
            this.checkingTorrents.delete(hash);
        }
    };

    private getTorrentInfo = async (category: string, hash: string) => {
        const magnet = 'magnet:?xt=urn:btih:' + hash;
        let torrentInfo: any;
        console.log(`Checking torrent ${hash}`);
        
        // Wait and check if torrent has started
        for (let attempt = 0; attempt < 12; attempt++) {
            this.io.emit('torrent-checking', { hash, message: `Torrent checking attempt ${attempt} of 11`});
            await new Promise(resolve => setTimeout(resolve, 5000));

            try {
                const infoResponse = await this.getTorrentInfoApi(category, hash);                   
                torrentInfo = infoResponse.find((torrent: any) => torrent.magnet_uri.includes(magnet));
            } catch (error) {
                console.error(`Error fetching torrent info: ${error}`);
                // Handle the error as needed
            }
            
            if (torrentInfo && torrentInfo.state === 'downloading') {
                // Torrent has started, exit the loop
                break;
            }

            if (attempt === 11) {
                // This was the last attempt and the torrent has not started, return an error
                throw new Error('Torrent has not started');
            }
        }

        return torrentInfo;
    };

    private getTorrentProperties = async (req: any, res: any) => {
        const hash = req.query.hash;

        if (!hash) return res.status(400).send({ error: 'Missing hash parameter' });

        try {
            const response = await this.getTorrentPropertiesApi(hash);
            res.send(response.data);
        } catch (error: any) {
            res.status(500).send(error);
        }
    };

    private setFilePriority = async (hash: string, fileIndices: number[], priority: number) => {
        try {
            const resumeResponse = await this.resumeTorrentApi(hash);
            if (resumeResponse.status !== 200) throw new Error(`Failed to resume torrent: ${resumeResponse.statusText}`);
            this.io.emit('torrent-resumed', { hash, message: 'Torrent download resumed.'});
            
            const filePrioResponse = await this.setFilePriorityApi(hash, fileIndices, priority);
            if (filePrioResponse.status !== 200) throw new Error(`Failed to set file priority: ${filePrioResponse.statusText}`);
            this.io.emit('torrent-file-priority', { hash, message: 'Files priority set.'});

            // wait for file to be downloaded
            const downloaded = await this.waitFileDownloaded(hash);            

            if (downloaded) {
                this.io.emit('torrent-downloaded', { hash, message: 'Torrent downloaded.'});
            }
        } catch (error: any) {
            this.io.emit('torrent-error', { hash, message: error.message });
        }
    };

    private getTorrentStatus = async (req: any, res: any) => {
        const hash = req.query.hash;

        if (!hash) return res.status(400).send({ error: 'Missing hash parameter' });

        try {
            const response = await this.getTorrentInfoApi('SCPDownload', hash);
            res.send(response[0]);
        } catch (error: any) {
            res.status(500).send(error);
        }
    };

    private waitFileDownloaded = async (hash: string) => {
        let downloaded = false;

        while (true) {
            const torrentStatus = await this.getTorrentInfoApi('SCPDownload', hash);
            const status = torrentStatus[0];
            const errorState = status.state === 'error' || status.state === 'missingFiles';
            const stillDownloading = status.state === 'downloading' || status.state === 'metaDL' || status.state === 'queuedDL' || status.state === 'stalledDL' || status.state === 'checkingDL' || status.state === 'forcedDL';
            downloaded = status.state === 'uploading' || status.state === 'seeding' || status.amount_left === 0 || status.progress === 1;

            this.io.emit('torrent-status', { 
                hash, 
                progress: status.progress * 100, 
                downloading: stillDownloading,
                message: `Torrent state is ${status.state} with download speed of ${status.dlspeed} and progress of ${status.progress * 100}%`
            });

            if (errorState) {
                throw new Error(`Torrent download failed with state: ${status.state}`);
            }

            await this.updateDBTorrentState(hash, {
                qbittorrentMediaPath: status.content_path,
                qBittorrentProgress: Math.round(status.progress * 100),
                qbittorrentDownloading: stillDownloading,
                qbittorrentDownloaded: downloaded,
            });

            if (downloaded) {
                this.addedTorrents.delete(hash);
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 30000));
        }

        return downloaded;
    };

    private AddTorrentTrackers = async (req: any, res: any) => {
        const hash = req.body.hash;

        if (!hash) return res.status(400).send({ error: 'Missing hash parameter' });

        this.addTorrentTrackersApi(hash, this.trackers).then((response: any) => {
            res.send({ message: 'Trackers added.'});
        }).catch((error: any) => {
            res.status(500).send(error.message);
        });
    };

    private debugTorrent = async (hash: string) => {
        const category = 'SCPDownload'; // personnalize
        
        try {
            await this.resumeTorrentApi(hash);
            
            const torrentInfo = await this.getTorrentInfo(category, hash);
            this.io.emit('torrent-started', { torrentInfo });
            
            // show torrent files 
            const filesResponse = await this.getTorrentFilesApi(hash);
            if (filesResponse && filesResponse.length === 0) throw new Error("Torrent has no files");
            this.io.emit('torrent-files', { hash, files: filesResponse, message: 'Torrent files found.'});
            
            // pause torrent
            await this.pauseTorrentApi(hash);            
            this.io.emit('torrent-paused', { hash, message: 'Torrent download paused.'});
        } catch (error: any) {
            this.io.emit('torrent-error', { hash, message: error.message });
        } finally {
            this.checkingTorrents.delete(hash);
        }
    };

    private deleteTorrent = async (hash: string, removeFiles: boolean) => {
        try {
            await this.deleteTorrentApi(hash, removeFiles);
            await this.updateDBTorrentState(hash, {
                qbittorrentAdded: false,
                qbittorrentDownloaded: false,
            });
            this.io.emit('torrent-deleted', { hash, message: 'Torrent deleted.' });
        } catch (error: any) {
            this.io.emit('torrent-error', { hash, message: error.message });
        } finally {
            this.addedTorrents.delete(hash);
        }
    };

    private updateDBTorrentState = async (hash: string, toUpdate: any) => {
        const savedInfo = await this.db.get(hash, true);
        if (savedInfo && savedInfo.qbittorrent) {
            for (const key in toUpdate) {
                savedInfo.qbittorrent[key] = toUpdate[key];
            }
        }
        await this.db.save(hash, savedInfo);
    };
}

export default qBittorrent;