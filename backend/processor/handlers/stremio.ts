import axios from 'axios';
import FileSystem from './filesystem';
import { calculateDownloadTime } from '../../utils';
import StremioClient from './stremio-client';
import { StremioStateFolderProcess } from '../../../interfaces';

class Stremio extends StremioClient {
    private stremioAppPath: string;
    private stremioCachePath: string;
    private stremioCheckTimeout: number;
    private stremioCheckRetries: number;
    private FileSystem: FileSystem;
    private app: any;
    private io: any;
    private db: any;
    private checkingFolders: Set<string>;

    constructor(stremioAppPath: string, stremioAppHost: string, stremioCachePath: string, stremioCheckTimeout: number, stremioCheckRetries: number, 
        FileSystem: FileSystem, app: any, io: any, db: any) {
        super(stremioAppHost);
        this.stremioAppPath = stremioAppPath;
        this.stremioCachePath = stremioCachePath;
        this.stremioCheckTimeout = stremioCheckTimeout;
        this.stremioCheckRetries = stremioCheckRetries;
        this.FileSystem = FileSystem;
        this.app = app;
        this.io = io;
        this.db = db;
        this.checkingFolders = new Set<string>();
        this.connection();
    }

    public updateConfig(stremioAppHost: string, stremioCachePath: string, stremioCheckTimeout: number, stremioCheckRetries: number, FileSystem: FileSystem): void {
        this.stremioAppHost = stremioAppHost;
        this.stremioCachePath = stremioCachePath;
        this.stremioCheckTimeout = stremioCheckTimeout;
        this.stremioCheckRetries = stremioCheckRetries;
        this.checkingFolders = new Set<string>();
        this.FileSystem = FileSystem;
        this.connection();
    }

    public buildEndpoints(): void {
        this.app.get('/api/stremio/connected', (req: any, res: any) => {
            this.connection();
            res.status(200).send({ connected: this.connected });
        });

        this.io.on('connection', (socket: any) => {
            console.log('user connected on stremio');
            
            socket.on('stremio-metacheck', async (data: any) => {                    
                const folder = data.id;
                const meta = data.meta;   

                if (!this.connected) {
                    this.io.emit('stremio-error', { hash: folder, message: 'Stremio is not connected' });
                    return;
                }       

                if (this.checkingFolders.has(folder)) {
                    // this.io.emit('stremio-error', { hash: folder, message: `Folder ${folder} is already being checked` });
                    return;
                }
                
                this.checkingFolders.add(folder);

                try {
                    await this.checkDownload(folder, meta);
                } finally {
                    this.io.emit('stremio-check-end', { hash: folder });
                }
            });

            socket.on('stremio-copy', async (data: any) => {
                try {
                    const folder = data.id;
                    const folderSavedInfo = await this.db.get(folder, true);
                    const stremioState = folderSavedInfo.stremio.stremioState;
                    
                    const file = stremioState.name; // todo: check if this is correct
                    const dest = stremioState.title;

                    this.io.emit('stremio-copying', { hash: folder, message: 'Copying file.' });
        
                    // clean copy with stremio file name
                    const copied = this.FileSystem.copyFile(folder, file, dest);
                    if (!copied) {
                        this.io.emit('stremio-error', { hash: folder, message: 'Error copying file.' });
                        return;
                    }
                    
                    folderSavedInfo['stremio']['stremioCopied'] = true;
                    await this.db.save(folder, folderSavedInfo);
                    
                    this.io.emit('stremio-copied', { hash: folder });
                } catch (error) {
                    this.io.emit('stremio-error', { hash: data.id, message: 'Error copying file.' });
                }
            });

            socket.on('disconnect', () => {
                console.log('user disconnected from stremio');
            });
        });
    };

    public getMetaInfo = async (id: string): Promise<any> => {
        const url = `${this.stremioAppHost}/local-addon/meta/other/bt:${id}.json`;
    
        const maxRetries = 3;
        let response;

        for (let i = 0; i < maxRetries; i++) {
            setTimeout(() => {}, 5000); // Wait for 1 second before retrying
            try {
                response = await axios.get(url, { timeout: 5000 });
                break; // If the request is successful, break out of the loop
            } catch (error: unknown) {
                if (i === maxRetries - 1) { // If this was the last retry
                    if (typeof error === 'object' && error !== null) {
                        const err = error as { code?: string; response?: { status?: number } };
                        if (err.code === 'ECONNABORTED') {
                            console.log('Request Timeout.');
                            return false;
                        } else if (err.response && err.response.status === 302) {
                            throw new Error('Too many redirects');
                        } else {
                            throw new Error(`Please start Stremio ${this.stremioAppPath} and try again.`);
                        }
                    }
                }
            }
        }

        return response ? response.data.meta : false;
    }

    public async processMetaInfo(folder: string, meta: any): Promise<StremioStateFolderProcess> {
        let file: StremioStateFolderProcess = {
            name: '',
            downloaded: false,
            downloadSize: 0,
            downloadSpeed: 0,
            remainingTime: null,
            progress: 0,
            size: 0,
            downloading: false,
            title: '',
        };

        if (meta['videos']) {
            const folderPath = this.stremioCachePath + "/" + folder;  
            const metaTitle = meta['name'];

            for (const videos of meta['videos']) {
                const videoTitle = videos['title'];
                const fileId = videos['stream']['fileIdx'];
                const episode = videoTitle.match(/(s|S)([0-9]+)(e|E)([0-9]+)/);

                let title: string;
                if (episode) {
                    title = metaTitle + ' ' + episode[0].toUpperCase();
                } else {
                    title = metaTitle;
                }

                const destFolder = this.FileSystem.userSaveFolder + title;
                const filepath = folderPath + "/" + fileId.toString();
                const pos = filepath.lastIndexOf(folder);
                            
                if (!this.FileSystem.fileExists(filepath) || this.FileSystem.folderExists(destFolder)) {
                    continue;
                }

                const stats = await this.getStatistics(folder, fileId);
                
                if (!stats) {
                    continue;
                }
                
                const downloadSpeed = stats['downloadSpeed'];
                const totalSize = stats['streamLen'];
                const downloaded = stats['downloaded'];
                const streamProgress = Math.round(stats['streamProgress'] * 100 * 100) / 100;
                const remainingTime = calculateDownloadTime(downloadSpeed, totalSize, downloaded);
                
                file = {
                    name: fileId.toString(),
                    downloaded: downloaded == totalSize || streamProgress >= 100,
                    downloadSize: downloaded,
                    downloadSpeed,
                    remainingTime,
                    progress: streamProgress,
                    size: totalSize,
                    downloading: downloadSpeed > 0 && streamProgress < 100,
                    title: title,
                };
            }
        }

        return file;
    }

    private getStatistics = async (folderId: string, fileId: string): Promise<any> => {
        /**
         * Get statistics of the given file
         * app is a constant of the host running the app
         * folder_id is a variable of the actual folder_id
         * id is an integer of the video file contained in folder_id
         */
        try {
            const url = `${this.stremioAppHost}/${folderId}/${fileId}/stats.json`;
            const response = await axios.get(url);
            return response.data;
        } catch (error: any) {
            console.log("Error getting File stats : ", error.message);
        }
    }

    private checkDownload = async (folder: string, meta: any, retries: number = 0, lastSize: number = 0): Promise<void> => {
        this.io.emit('stremio-check-info', { hash: folder, message: `Checking download for folder ${folder} | retries: ${retries} | lastSize: ${lastSize}.`});
        
        let stremioState = await this.processMetaInfo(folder, meta);
        
        let recheck = false;

        if (stremioState.downloadSpeed > 0 && !stremioState.downloaded && stremioState.downloading) {
            if (stremioState.size === lastSize) {
                retries++;
            } else {
                retries = 0;
            }

            if (retries < this.stremioCheckRetries) {
                this.io.emit('stremio-check-info', { hash: folder, message: `Folder ${folder} download size changing, continuing checks.` });

                const ms = stremioState.remainingTime && stremioState.remainingTime !== 0 
                    ? Math.min(stremioState.remainingTime * 1000, this.stremioCheckTimeout) 
                    : this.stremioCheckTimeout;   

                this.io.emit('stremio-check-info', { hash: folder, message: `Next check in ${ms / 1000} seconds` })             
                
                recheck = true;
            } else {
                this.io.emit('stremio-check-info', { hash: folder, message: `Folder ${folder} download size not changing, stopping checks.` });
                
                recheck = false;
                stremioState['downloading'] = false;
            }
        }
        
        const savedInfo = await this.db.get(folder, true);
        if (savedInfo && savedInfo['stremio']) {
            savedInfo.stremio.stremioState = stremioState;
            savedInfo.stremio.stremioDownloaded = stremioState.downloaded;
        }

        // Mark the folder as processed
        await this.db.save(folder, savedInfo);

        this.io.emit('meta-resync', { id: folder, ...stremioState });                

        if (recheck) {
            setTimeout(() => {
                this.checkDownload(folder, meta, retries, stremioState.size);
            }, this.stremioCheckTimeout);
        } else {
            this.checkingFolders.delete(folder);
            return;
        }
    }
}

export default Stremio;