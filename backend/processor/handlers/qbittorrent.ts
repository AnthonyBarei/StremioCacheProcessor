import qBittorrentClient from './qbittorrent-client';
import axios from 'axios';

class qBittorrent extends qBittorrentClient {
    private app: any;
    private io: any;
    private db: any;
    private trackers: string[] = [];
    private addedTorrents = new Set<string>();
    private checkingTorrents = new Set<string>();
    
    constructor(qBittorrentAppHost: string, qbittorrentApi: string, qbittorrentCredentials: string, app: any, io: any, db: any) {
        super(qBittorrentAppHost, qbittorrentApi, qbittorrentCredentials);
        this.app = app;
        this.io = io;
        this.db = db;
        this.addedTorrents = new Set<string>();
        this.checkingTorrents = new Set<string>();
        this.connection();
        this.getLastTrackers();
    };

    public updateConfig(qBittorrentAppHost: string): void {
        this.qBittorrentAppHost = qBittorrentAppHost;
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

            socket.on('torrent-retry', (response: any) => {
                if (this.checkingTorrents.has(response.hash)) {
                    this.io.emit('torrent-error', { hash: response.hash, message: 'Torrent already retrying.' });
                    return;
                }

                this.checkingTorrents.add(response.hash);
                this.retryTorrent(response.hash);
            });

            socket.on('torrent-delete', (response: any) => {
                this.deleteTorrent(response.hash);
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
        const category = 'movies'; // personnalize
        
        try {
            // api add torrent
            await this.AddTorrentApi(magnet, category);
            this.io.emit('torrent-added', { hash, message: 'Torrent added.'});
            await this.updateDBTorrentStateAdded(hash, true);

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

        // Wait and check if torrent has started
        for (let attempt = 0; attempt < 12; attempt++) {
            this.io.emit('torrent-checking', { hash, message: `Torrent checking attempt ${attempt} of 11`});
            await new Promise(resolve => setTimeout(resolve, 5000));

            try {
                const infoResponse = await this.getTorrentInfoApi(category);                   
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
                await this.updateDBTorrentStateDownloaded(hash, downloaded);
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
            const response = await this.getTorrentInfoApi('movies', hash);
            res.send(response[0]);
        } catch (error: any) {
            res.status(500).send(error);
        }
    };

    private waitFileDownloaded = async (hash: string) => {
        let fileDownloaded = false;

        while (!fileDownloaded) {
            const torrentStatus = await this.getTorrentInfoApi('movies', hash);
            const status = torrentStatus[0];
            
            this.io.emit('torrent-status', { 
                hash, progress: 
                status.progress * 100, 
                message: `Torrent state is ${status.state} with download speed of ${status.dlspeed} and progress of ${status.progress * 100}%`
            });

            if (status.state === 'uploading' || status.state === 'seeding' || status.amount_left === 0 || status.progress === 1) {
                fileDownloaded = true;
                this.addedTorrents.delete(hash);
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 30000));
        }

        return fileDownloaded;
    };

    private AddTorrentTrackers = async (req: any, res: any) => {
        const hash = req.body.hash;

        if (!hash) return res.status(400).send({ error: 'Missing hash parameter' });

        this.addTorrentTrackersApi(hash, this.trackers).then((response: any) => {
            res.send(response);
        }).catch((error: any) => {
            res.status(500).send(error);
        });
    };

    private retryTorrent = async (hash: string) => {
        const category = 'movies'; // personnalize
        
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

    private deleteTorrent = async (hash: string) => {
        try {
            await this.deleteTorrentApi(hash, true);
            await this.updateDBTorrentStateAdded(hash, false);
            this.io.emit('torrent-deleted', { hash, message: 'Torrent deleted.' });
        } catch (error: any) {
            this.io.emit('torrent-error', { hash, message: error.message });
        } finally {
            this.addedTorrents.delete(hash);
        }
    };

    private updateDBTorrentStateAdded = async (hash: string, state: boolean) => {
        const saved = await this.db.get(hash);
        const savedInfo = JSON.parse(saved);
        if (savedInfo && savedInfo.qbittorrent) {
            savedInfo.qbittorrent.qbittorrentAdded = state;
        }
        await this.db.save(hash, savedInfo);
    };

    private updateDBTorrentStateDownloaded = async (hash: string, state: boolean) => {
        const saved = await this.db.get(hash);
        const savedInfo = JSON.parse(saved);
        if (savedInfo && savedInfo.qbittorrent) {
            savedInfo.qbittorrent.qbittorrentDownloaded = state;
        }
        await this.db.save(hash, savedInfo);
    };
}

export default qBittorrent;