import qBittorrentClient from './qbittorrent-client';
import axios from 'axios';

class qBittorrent extends qBittorrentClient {
    private app: any;
    private io: any;
    private trackers: string[] = [];
    
    constructor(qBittorrentAppHost: string, qbittorrentApi: string, qbittorrentCredentials: string, app: any, io: any) {
        super(qBittorrentAppHost, qbittorrentApi, qbittorrentCredentials);
        this.app = app;
        this.io = io;
        this.connection();
        this.getLastTrackers();
    };

    public updateConfig(qBittorrentAppHost: string): void {
        this.qBittorrentAppHost = qBittorrentAppHost;
    };

    public buildEndpoints(): void {
        this.app.get('/api/torrent/connected', (req: any, res: any) => {
            res.status(200).send({ connected: this.connected });
        });
        this.app.get('/api/torrent/files', this.getTorrentFiles);
        this.app.get('/api/torrent/properties', this.getTorrentProperties);
        this.app.get('/api/torrent/status', this.getTorrentStatus);
        this.app.post('/api/torrent/trackers', this.AddTorrentTrackers);

        this.io.on('connection', (socket: any) => {
            console.log('user connected on qbittorrent');

            socket.on('torrent-add', (response: any) => {     
                if (!this.connected) return;          
                this.addTorrent(response.hash);
            });

            socket.on('set-torrent-fileprio', (response: any) => {
                this.setFilePriority(response.hash, response.fileIndices, response.priority);
            });

            socket.on('torrent-retry', (response: any) => {
                this.retryTorrent(response.hash);
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
            this.io.emit('torrent-added', { magnet });

            const torrentInfo = await this.getTorrentInfo(category, magnet);
            this.io.emit('torrent-started', { torrentInfo });
            
            // show torrent files 
            const filesResponse = await this.getTorrentFilesApi(torrentInfo.hash);
            
            if (filesResponse && filesResponse.length === 0) throw new Error("Torrent has no files");
            
            this.io.emit('torrent-files', { files: filesResponse, hash: torrentInfo.hash });
            
            // pause torrent
            await this.pauseTorrentApi(torrentInfo.hash);            
            this.io.emit('torrent-paused', { hash: torrentInfo.hash });
        } catch (error: any) {
            console.log(error.message);
            
            // res.status(500).send(error.message);
        }
    };

    private getTorrentInfo = async (category: string, magnet: string) => {
        let torrentInfo: any;

        // Wait and check if torrent has started
        for (let attempt = 0; attempt < 12; attempt++) {
            this.io.emit('torrent-checking', { attempt: attempt, total: 11 });
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
        const magnet = 'magnet:?xt=urn:btih:' + hash;

        try {
            const resumeResponse = await this.resumeTorrentApi(hash);
            if (resumeResponse.status !== 200) throw new Error(`Failed to resume torrent: ${resumeResponse.statusText}`);
            this.io.emit('torrent-resumed', { magnet });
            
            const filePrioResponse = await this.setFilePriorityApi(hash, fileIndices, priority);
            if (filePrioResponse.status !== 200) throw new Error(`Failed to set file priority: ${filePrioResponse.statusText}`);
            this.io.emit('torrent-file-priority', { hash, fileIndices, priority });

            // wait for file to be downloaded
            const downloaded = await this.waitFileDownloaded(hash);
            this.io.emit('torrent-downloaded', { hash, downloaded });
        } catch (error: any) {
            console.log(error.message);
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
        let fileProgress = 0;

        while (!fileDownloaded) {
            await new Promise(resolve => setTimeout(resolve, 30000));

            const torrentStatus = await this.getTorrentInfoApi('movies', hash);
            const status = torrentStatus[0];
            
            fileProgress = status.progress;
            
            if (status.state === 'downloaded' || status.downloaded === status.size || status.progress === 100) {
                fileDownloaded = true;
            }

            this.io.emit('torrent-status', { hash, progress: fileProgress, state: status.state, dlspeed: status.dlspeed});
        }

        return fileProgress;
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
        const magnet = 'magnet:?xt=urn:btih:' + hash;
        const category = 'movies'; // personnalize
        
        try {
            const torrentInfo = await this.getTorrentInfo(category, magnet);
            this.io.emit('torrent-started', { torrentInfo });
            
            // show torrent files 
            const filesResponse = await this.getTorrentFilesApi(torrentInfo.hash);
            if (filesResponse && filesResponse.length === 0) throw new Error("Torrent has no files");
            this.io.emit('torrent-files', { files: filesResponse, hash: torrentInfo.hash });
            
            // pause torrent
            await this.pauseTorrentApi(torrentInfo.hash);            
            this.io.emit('torrent-paused', { hash: torrentInfo.hash });
        } catch (error: any) {
            console.log(error.message);
        }
    };
}

export default qBittorrent;