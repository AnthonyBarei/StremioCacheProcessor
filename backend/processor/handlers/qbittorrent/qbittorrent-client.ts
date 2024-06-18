import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import FormData from 'form-data';
import Configuration from '../configuration';

class qBittorrentClient {
    private axiosInstance: any;
    protected Configuration: Configuration;
    protected connected: boolean = false;
    
    constructor(Configuration: Configuration) {
        this.Configuration = Configuration;
        const jar = new CookieJar();
        this.axiosInstance = wrapper(axios.create({ jar, withCredentials: true}));
    }

    protected connection(): void {      
        this.axiosInstance.post(this.Configuration.config.qbittorrent.qbittorrentApi + '/auth/login', this.Configuration.config.qbittorrent.qbittorrentCredentials, {
            headers: {
                'Referer': this.Configuration.config.qbittorrent.qBittorrentAppHost,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then((response: any) => {            
            console.log('Connected to torrent server');
            this.connected = true;
        }).catch((error: any) => {
          console.error('Could not connect to torrent server');
          this.connected = false;
        });
    }

    protected getTorrentFilesApi = async (hash: string) => {
        try {
            const response = await this.axiosInstance.get(`${this.Configuration.config.qbittorrent.qbittorrentApi}/torrents/files?hash=${hash}`, {
                params: {
                    hash: hash
                },
                headers: {
                    'Accept': 'application/json',
                    'Referer': this.Configuration.config.qbittorrent.qBittorrentAppHost,
                }
            });

            return response.data;
        } catch (error: any) {
            throw new Error(error);
        }
    };

    protected AddTorrentApi = async (magnet: string, category: string) => {
        try {
            const form = new FormData();
            form.append('urls', magnet);
            form.append('savepath', 'C:/Users/antho/Videos/Films'); // to add in config qBittorrent
            form.append('category', category); // personnalize
            form.append('skip_checking', 'false');
            form.append('paused', 'false');
            form.append('root_folder', 'true');
            
            const response = this.axiosInstance.post(`${this.Configuration.config.qbittorrent.qbittorrentApi}/torrents/add`, form, {
                headers: form.getHeaders()
            });

            return response.data;
        } catch (error: any) {
            throw new Error(error);
        }
    };

    protected getTorrentInfoApi = async (category: string, hashes: string = '') => {
        try {
            const response = await this.axiosInstance.get(`${this.Configuration.config.qbittorrent.qbittorrentApi}/torrents/info?filtering=downloading&category=${category}`+ (hashes ? `&hashes=${hashes}` : ''));                    
            return response.data;
        } catch (error: any) {
            throw new Error(error);
        }
    };

    protected getTorrentTrackersApi = async (hash: string) => {
        console.log(hash);
        
        try {            
            const response = await this.axiosInstance.get(`${this.Configuration.config.qbittorrent.qbittorrentApi}/torrents/trackers?hash=${hash}`); // todo : verify
            return response.data;
        } catch (error: any) {
            throw new Error(error);
        }
    };

    protected pauseTorrentApi = async (hash: string) => {
        try {
            const data = new URLSearchParams();
            data.append('hashes', hash);
            const response = await this.axiosInstance.post(`${this.Configuration.config.qbittorrent.qbittorrentApi}/torrents/pause`, data);
            
            return response.data;
        } catch (error: any) {            
            throw new Error(error);
        }
    };

    protected resumeTorrentApi = async (hash: string) => {
        try {
            const data = new URLSearchParams();
            data.append('hashes', hash);
            const response = await this.axiosInstance.post(`${this.Configuration.config.qbittorrent.qbittorrentApi}/torrents/resume`, data);
            
            return response;
        } catch (error: any) {
            throw new Error(error);
        }
    };

    protected setFilePriorityApi = async (hash: string, fileIndices: number[], priority: number) => {
        try {
            const data = new URLSearchParams();
            data.append('hash', hash);
            data.append('id', fileIndices.join('|'));
            data.append('priority', priority.toString());
            const response = await this.axiosInstance.post(`${this.Configuration.config.qbittorrent.qbittorrentApi}/torrents/filePrio`, data);

            return response;
        } catch (error: any) {
            throw new Error(error);
        }
    };

    protected getTorrentPropertiesApi = async (hash: string) => {
        try {
            const response = await this.axiosInstance.get(`${this.Configuration.config.qbittorrent.qbittorrentApi}/torrents/properties?hash=${hash}`);

            return response.data;
        } catch (error: any) {
            throw new Error(error);
        }
    };

    protected addTorrentTrackersApi = async (hash: string, trackers: string[]) => {
        try {
            const data = new URLSearchParams();
            data.append('hash', hash);
            data.append('urls', trackers.join('\n'));
            const response = await this.axiosInstance.post(`${this.Configuration.config.qbittorrent.qbittorrentApi}/torrents/addTrackers`, data);
            return response.data;
        } catch (error: any) {
            throw new Error(error);
        }
    };

    protected deleteTorrentApi = async (hash: string, deleteFiles: boolean) => {
        try {
            const data = new URLSearchParams();
            data.append('hashes', hash);
            data.append('deleteFiles', deleteFiles.toString());
            const response = await this.axiosInstance.post(`${this.Configuration.config.qbittorrent.qbittorrentApi}/torrents/delete`, data);
            return response.data;
        } catch (error: any) {
            throw new Error(error);
        }
    };
}

export default qBittorrentClient;