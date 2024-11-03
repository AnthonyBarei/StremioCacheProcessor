import PlexClient from './plexClient';
import { spawn } from 'child_process';
import FileSystem from '../filesystem/filesystem';
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
    private copyFolders: Set<string>;

    constructor(Configuration: Configuration, FileSystem: FileSystem, app: Express, io: Server, db: Database) {
        super(Configuration);
        this.FileSystem = FileSystem;
        this.app = app;
        this.db = db;
        this.io = io;
        this.copyFolders = new Set();
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
                    this.io.emit('plex-error', { hash: data.hash, message: err.message });
                }
            });

            socket.on('plex-copy', (data: {hash: string, library: string, path: string}) => {
                if (this.copyFolders.has(data.hash)) {
                    this.io.emit('plex-error', { hash: data.hash, message: 'Folder already being copied.' });
                    return;          
                }

                this.copyFolders.add(data.hash);
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

            socket.on('plex-get-library-content', async (data: {hash: string, key: string, force: boolean}) => {
                try {
                    const library = this.Configuration.config.plex.plexStoragePath.find((lib: ConfigurationLibrary) => lib.key === data.key)?.path || "";
                    const savedContent = await this.db.get(library, true);
                    
                    if (savedContent && !data.force) {
                        this.io.emit('plex-library-content', { hash: data.hash, content: savedContent });
                        return;
                    }
    
                    const content = this.FileSystem.getFoldersFromPath(library);
                    await this.db.save(library, content);
                    this.io.emit('plex-library-content', { hash: data.hash, content });
                } catch (err: any) {
                    this.io.emit('plex-error', { hash: data.hash, message: err.message });
                }
            });

            socket.on('disconnect', () => {
                console.log('user disconnected from plex');
            });
        });
    }

    private copy = async (hash: string, library: string, dest: string) => {
        try {
            const folderSavedInfo = await this.db.get(hash, true);    
            let source = '';

            if (folderSavedInfo['stremio']['stremioDownloaded']) {
                const name = folderSavedInfo['stremio']['stremioState']['title'];
                source = this.FileSystem.joinPath(folderSavedInfo['destination'], name);
            }

            if (folderSavedInfo['qbittorrent']['qbittorrentDownloaded'] && source === '') {
                source = folderSavedInfo['qbittorrent']['qbittorrentMediaPath'];
            }            
                        
            const copied = await this.FileSystem.copyFolderToPlexServer(source, dest);
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
        } finally {
            this.copyFolders.delete(hash);
        }
    };
}

export default Plex;