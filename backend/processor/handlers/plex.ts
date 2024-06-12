import PlexClient from './plexClient';
import { spawn } from 'child_process';
import FileSystem from './filesystem';
import { ConfigurationLibrary } from '../../../interfaces';


class Plex extends PlexClient {
    private plexStoragePath: ConfigurationLibrary[];
    private plexMetadataCommand: string;
    private app: any;
    private db: any;
    private io: any;
    private FileSystem: FileSystem;

    constructor(plexAppHost: string, plexStoragePath: ConfigurationLibrary[], plexToken: string, plexMetadataCommand: string, app: any, db: any, io: any, FileSystem: FileSystem) {
        super(plexAppHost, plexToken);
        this.plexStoragePath = plexStoragePath;
        this.plexMetadataCommand = plexMetadataCommand;
        this.app = app;
        this.db = db;
        this.io = io;
        this.FileSystem = FileSystem;
    }

    public updateConfig(plexAppHost: string, plexStoragePath: ConfigurationLibrary[]): void {
        this.plexAppHost = plexAppHost;
        this.plexStoragePath = plexStoragePath;
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
                    console.log(data);
                    
                    this.io.emit('plex-libraries', { hash: data.hash, plexStoragePath: this.plexStoragePath });
                } catch (err: any) {
                    console.log(err.message);
                    this.io.emit('plex-error', { hash: data.hash, message: err.message });
                }
            });

            socket.on('plex-copy', (data: {hash: string, library: string}) => {                
                this.copy(data.hash, data.library);
            });

            socket.on('plex-metamanager', (data: {hash: string}) => {
                const hash = data.hash;
                
                try {
                    // exec windows command
                    const kometa = spawn(this.plexMetadataCommand, [], { shell: true });

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
    private copy = async (hash: string, library: string) => {
        try {    
            const saved = await this.db.get(hash);
            let folderSavedInfo = JSON.parse(saved);
    
            
            const name = folderSavedInfo['stremio']['stremioState']['title'];
            const dest = this.plexStoragePath?.find((lib) => lib.key === library)?.path || "";
            
            const copied = this.FileSystem.copyFolderToPlexServer(name, dest);
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