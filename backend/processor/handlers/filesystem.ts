import * as fs from 'fs';
import chokidar from 'chokidar';
import path from 'path';
import { exec } from 'child_process';
import ncp from 'ncp';
import Configuration from './configuration';

class FileSystem {
    public Configuration: Configuration;

    constructor(Configuration: Configuration) {
        this.Configuration = Configuration;
    }

    public getCacheFolders() {
        try {
            const directories = fs.readdirSync(this.Configuration.config.stremio.stremioCachePath);
            directories.sort((a, b) => {
                const aPath = path.join(this.Configuration.config.stremio.stremioCachePath, a);
                const bPath = path.join(this.Configuration.config.stremio.stremioCachePath, b);
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

        chokidar.watch(this.Configuration.config.stremio.stremioCachePath, {depth: 1}).on('all', (eventType, path) => {
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
        return fs.existsSync(path.join(this.Configuration.config.stremio.stremioCachePath, folder));
    }

    public deleteFolder(folder: string): boolean {
        try {
            fs.rmSync(path.join(this.Configuration.config.stremio.stremioCachePath, folder), { recursive: true });
            return true;
        } catch (err) {
            console.error('Unable to delete folder: ' + err);
        }

        return false;
    }

    public getFolderDate(folder: string): Date {
        const stats = fs.statSync(path.join(this.Configuration.config.stremio.stremioCachePath, folder));
        return stats.birthtime;
    }

    public copyFile(folder: string, file: string, dest: string): boolean {
        try {            
            const source = path.join(this.Configuration.config.stremio.stremioCachePath, folder, file);            

            if (!fs.existsSync(source)) {
                console.error('Source file does not exist');
                return false;
            }

            // Replace invalid characters in the folder name
            const safeDest = this.safePath(dest);

            const target = path.join(this.Configuration.config.user.userSaveFolder, safeDest);
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

    public copyFolderToPlexServer(source: string, dest: string): boolean {
        try {
            if (!fs.existsSync(source)) {
                console.error('Source does not exist');
                return false;
            }
    
            const fileName = path.basename(source);
            const safeDest = this.safePath(path.join(dest, fileName));
            let target = safeDest;
            let parsedPath = path.parse(target);
            let filenameWithoutExtension = parsedPath.name;
    
            if (fs.lstatSync(source).isDirectory()) {
                if (!fs.existsSync(target)) {
                    fs.mkdirSync(target);
                    target = path.join(target, fileName);
                }
            } else {
                if (!fs.existsSync(safeDest)) {
                    fs.mkdirSync(safeDest);
                }
                target = path.join(safeDest, fileName);
            }
    
            // copy source to newly created folder
            ncp(source, target, function (err: any) {
                if (err) {
                    console.error('Unable to copy: ' + err);
                    return false;
                }
                console.log('Copied successfully');
                return true;
            });

            return true;
        } catch (error) {
            console.error('An error occurred: ' + error);
            return false;
        }
    }

    public startVideo(title: string): boolean {
        try {
            const safeTitle = this.safePath(title);
            const file = path.join(this.Configuration.config.user.userSaveFolder, safeTitle, `${safeTitle}.mkv`);
    
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

            return true;
        } catch (err) {
            console.error('Unable to start video: ' + err);
        }

        return false;
    }

    public getFirstMediaFile(folder: string): string {
        const stats = fs.statSync(folder);

        if (stats.isDirectory()) {
            console.log(`${folder} is a directory`);
            const files = fs.readdirSync(folder);
            const videoExtensions = ['.mp4', '.mkv', '.flv', '.avi', '.mov', '.wmv', '.rmvb', '.mpeg', '.mpg', '.vob', '.webm'];
            const fileName = files.find(file => videoExtensions.some(ext => file.endsWith(ext)));
            return fileName ? path.join(folder, fileName) : '';
        } else {
            console.log(`${folder} is not a directory`);
            const videoExtensions = ['.mp4', '.mkv', '.flv', '.avi', '.mov', '.wmv', '.rmvb', '.mpeg', '.mpg', '.vob', '.webm'];
            if (videoExtensions.some(ext => folder.endsWith(ext))) {
                return folder;
            } else {
                return '';
            }
        }
    }

    public startVideoHardPath(path: string): boolean {
        try {
            exec(`start "" "${path}"`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    return false;
                }
            });

            return true;
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

    public joinPath(...paths: string[]): string {
        return this.safePath(path.join(...paths));
    }

    public getFoldersFromPath(folderPath: string): any[] {
        let result = [];
        const files = fs.readdirSync(folderPath);

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                result.push({
                    name: file,
                    subfolders: this.getFoldersFromPath(filePath)
                });
            }
        }

        // TODO : cache this

        return result;
    }
}

export default FileSystem;