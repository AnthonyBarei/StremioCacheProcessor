import PlexClient from './plexClient';
import { spawn } from 'child_process';
import FileSystem from '../filesystem';
import { ConfigurationLibrary } from '../../../../interfaces';
import Configuration from '../configuration';
import { Express } from 'express';
import { Server } from 'socket.io';
import Database from '../../../db';


class Plex extends PlexClient {
    private FileSystem: FileSystem;
    private app: Express;
    private io: Server;
    private db: Database;

    constructor(Configuration: Configuration, FileSystem: FileSystem, app: Express, io: Server, db: Database) {
        super(Configuration);
        this.FileSystem = FileSystem;
        this.app = app;
        this.db = db;
        this.io = io;
    }

    public buildEndpoints(): void {
        this.app.get('/api/plex/connected', (req: any, res: any) => {
            this.connection();
            res.status(200).send({ connected: this.connected });
        });

        this.app.get('/api/plex/libraries', async (req: any, res: any) => {
            const libraries = await this.getLibraries();
            console.log(libraries);
            
            res.status(200).send({ libraries });
        });

        this.app.get('/api/plex/library-content/:key', (req: any, res: any) => {
            const { key } = req.params;
            
            const library = this.Configuration.config.plex.plexStoragePath.find((lib: ConfigurationLibrary) => lib.key === key)?.path || "";
            
            const content = this.FileSystem.getFoldersFromPath(library);
            res.status(200).send({ content });
        });

        this.app.post('/api/plex/scan/:key', async (req: any, res: any) => {
            const { key } = req.params;
            const response = await this.scanLibrary(key);
            console.log(response);
            res.status(200).send({ response });
        });

        this.io.on('connection', (socket: any) => {
            console.log('user connected to plex');
            
            socket.on('get-plex-libraries', async (data: {hash: string}) => {
                try {                    
                    this.io.emit('plex-libraries', { hash: data.hash, plexStoragePath: this.Configuration.config.plex.plexStoragePath });
                } catch (err: any) {
                    console.log(err.message);
                    this.io.emit('plex-error', { hash: data.hash, message: err.message });
                }
            });

            socket.on('plex-copy', (data: {hash: string, library: string, path: string}) => {                
                this.copy(data.hash, data.library, data.path);
            });

            socket.on('plex-metamanager', (data: {hash: string}) => {
                const hash = data.hash;
                
                try {
                    // exec windows command
                    const kometa = spawn(this.Configuration.config.plex.plexMetadataCommand, [], { shell: true });

                    kometa.on('close', (code) => {
                        this.io.emit('plex-metadata-done', { hash, code });
                    });
                } catch (err: any) {
                    this.io.emit('plex-error', { hash, message: err.message });
                }
            });

            socket.on('disconnect', () => {
                console.log('user disconnected from plex');
            });
        });
    }

    // copy stremio from prev dest to new dest
    private copy = async (hash: string, library: string, dest: string) => {
        try {
            const folderSavedInfo = await this.db.get(hash, true);    
            let source = '';

            if (folderSavedInfo['stremio']['stremioDownloaded']) {
                const name = folderSavedInfo['stremio']['stremioState']['title'];
                source = this.FileSystem.joinPath(this.Configuration.config.user.userSaveFolder, name);
            }

            if (folderSavedInfo['qbittorrent']['qbittorrentDownloaded'] && source === '') {
                source = folderSavedInfo['qbittorrent']['qbittorrentMediaPath'];
            }

            console.log(source, dest);
            
                        
            const copied = this.FileSystem.copyFolderToPlexServer(source, dest);
            if (!copied) {
                throw new Error('Unable to copy folder');
            }
    
            folderSavedInfo['plex'] = folderSavedInfo['plex'] ? folderSavedInfo['plex'] : {};
            folderSavedInfo['plex']['plexCopied'] = true;
            await this.db.save(hash, folderSavedInfo);
            this.io.emit('plex-copied', { hash, message: 'Folder copied' });

            await this.scanLibrary(library);
            this.io.emit('plex-scanned', { hash, message: 'Library scanned'});
        } catch (err: any) {
            console.log(err.message);
            this.io.emit('plex-error', { message: err.message });
        }
    };
}

export default Plex;