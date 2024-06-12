import * as fs from 'fs';
import chokidar from 'chokidar';
import path from 'path';
import { exec } from 'child_process';
import ncp from 'ncp';

class FileSystem {
    public stremioCachePath: string;
    public userSaveFolder: string;
    public plexStoragePath: string;

    constructor(stremioCachePath: string, userSaveFolder: string, plexStoragePath: string) {
        this.stremioCachePath = stremioCachePath;
        this.userSaveFolder = userSaveFolder;
        this.plexStoragePath = plexStoragePath;
    }

    public updateConfig(stremioCachePath: string, userSaveFolder: string): void {
        this.stremioCachePath = stremioCachePath;
        this.userSaveFolder = userSaveFolder;
    }

    public getCacheFolders() {
        try {
            const directories = fs.readdirSync(this.stremioCachePath);
            directories.sort((a, b) => {
                const aPath = path.join(this.stremioCachePath, a);
                const bPath = path.join(this.stremioCachePath, b);
                const aStats = fs.statSync(aPath);
                const bStats = fs.statSync(bPath);
                return aStats.birthtime.getTime() - bStats.birthtime.getTime();
            });
            
            return directories;
        } catch (err) {
            console.error('Unable to scan directory: ' + err);
            return [];
        }
    }

    public watchdog(onChange: (folder: string) => void): void { // todo : onAdd() and onChange() should be separate
        let folderList: any[] = [];

        chokidar.watch(this.stremioCachePath, {depth: 1}).on('all', (eventType, path) => {
            if (eventType === 'add' || eventType === 'change') {                                
                const folder = path.split('\\').slice(-2, -1)[0];
                if (folderList.includes(folder)) return;
                folderList.push(folder);
                onChange(folder);
            }
        });
    }

    public countCacheFiles(folderPath: string): number {
        const cacheFiles = fs.readdirSync(folderPath);
        let cacheFilesFound: number = 0;
    
        for (const fileName of cacheFiles) {
            if (fileName != 'cache' && fileName != 'bitfield') {
                const filePath = folderPath + "/" + fileName;
                const fileStats = fs.statSync(filePath);
                if (fileStats.size > 0) {
                    cacheFilesFound += 1;
                }
            }
        }
    
        return cacheFilesFound;
    }

    public fileExists(filePath: string): boolean {
        return fs.existsSync(filePath);
    }

    public folderExists(folder: string): boolean {
        return fs.existsSync(path.join(this.stremioCachePath, folder));
    }

    public deleteFolder(folder: string): boolean {
        try {
            fs.rmSync(path.join(this.stremioCachePath, folder), { recursive: true });
            return true;
        } catch (err) {
            console.error('Unable to delete folder: ' + err);
        }

        return false;
    }

    public getFolderDate(folder: string): Date {
        const stats = fs.statSync(path.join(this.stremioCachePath, folder));
        return stats.birthtime;
    }

    public copyFile(folder: string, file: string, dest: string): boolean {
        try {            
            const source = path.join(this.stremioCachePath, folder, file);            

            if (!fs.existsSync(source)) {
                console.error('Source file does not exist');
                return false;
            }

            // Replace invalid characters in the folder name
            const safeDest = this.safePath(dest);

            const target = path.join(this.userSaveFolder, safeDest);
            if (!fs.existsSync(target)) {
                fs.mkdirSync(target);
            }

            // copy source file to newly created folder
            fs.copyFileSync(source, path.join(target, `${safeDest}.mkv`));

            return true;
        } catch (err) {
            console.log('Unable to copy folder: ' + err);
        }

        return false;
    };

    public copyFolderToPlexServer(name: string, dest: string): boolean {
        try {
            const safeSource = this.safePath(path.join(this.userSaveFolder, name));            
            
            if (!fs.existsSync(safeSource)) {
                console.error('Source folder does not exist');
                return false;
            }
        
            const safeDest = this.safePath(path.join(dest, name));
            const target = path.join(safeDest);

            if (!fs.existsSync(target)) {
                fs.mkdirSync(target);
            }            

            // copy source folder to newly created folder
            ncp(safeSource, safeDest, function (err: any) {
                if (err) {
                    console.error('Unable to copy folder: ' + err);
                    return false;
                }
                console.log('Folder copied successfully');
                return true;
            });

            return true;
        } catch (err) {
            console.log('Unable to copy folder: ' + err);
        }

        return false;
    }

    public startVideo(title: string): boolean {
        try {
            const safeTitle = this.safePath(title);
            const file = path.join(this.userSaveFolder, safeTitle, `${safeTitle}.mkv`);
    
            const fileExists = this.fileExists(file);
            if (!fileExists) {
                return false;
            }
    
            exec(`start "" "${file}"`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    return false;
                }
            });
        } catch (err) {
            console.error('Unable to start video: ' + err);
        }

        return false;
    }

    private safePath(source: string): string {
        const pathParts = path.parse(source);
        const safeBase = pathParts.base.replace(/[:]/g, '_');
        const safeSource = path.join(pathParts.dir, safeBase);
        return safeSource;
    }
}

export default FileSystem;