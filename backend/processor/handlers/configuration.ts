import { Express } from 'express';
import Database from '../../db';

class Configuration {
    public config: any;
    private app: Express;
    private db: Database;

    constructor(config: any, app: Express, db: Database) {
        this.config = config;
        this.app = app;
        this.db = db;
    }

    public buildEndpoints(): void {
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

        this.app.get('/api/configuration/userSaveFolder', (req, res) => {
            res.send({ userSaveFolder: this.config.user.userSaveFolder });
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
            
            await this.db.save('config', this.config);

            res.send({ message: 'Storage path deleted' });
        });
    }
}

export default Configuration;