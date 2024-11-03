import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import { exec } from 'child_process';
import * as os from 'os';
import axios from 'axios';
import CONFIG from '../config';

class Installer {
    private stremioInstallerUrl: string;
    private qbittorrentInstallerUrl: string;
    private stremioInstallerPath: string;
    private qbittorrentInstallerPath: string;
    private stremioExecutablePath: string;
    private qbittorrentExecutablePath: string;

    constructor(private config: typeof CONFIG) {
        this.stremioInstallerUrl = config.stremio.stremioGithubUrl;
        this.qbittorrentInstallerUrl = config.qbittorrent.qbittorrentGithubUrl;
        this.qbittorrentInstallerPath = path.join(os.tmpdir(), 'qbittorrent-installer.exe');
        this.stremioInstallerPath = path.join(os.tmpdir(), 'stremio-installer.exe');
        this.stremioExecutablePath = config.stremio.stremioAppPath;
        this.qbittorrentExecutablePath = config.qbittorrent.qbittorrentAppPath;
    }

    private async downloadFile(url: string, dest: string, headers: Record<string, string> = {}, retries: number = 3): Promise<void> {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                await new Promise((resolve, reject) => {
                    const file = fs.createWriteStream(dest);
                    const options = {
                        headers: headers
                    };
                    https.get(url, options, (response) => {
                        response.pipe(file);
                        file.on('finish', () => {
                            file.close((err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(undefined);
                                }
                            });
                        });
                    }).on('error', (err) => {
                        fs.unlink(dest, () => reject(err));
                    });
                });
                console.log(`File downloaded successfully: ${url}`);
                const stats = fs.statSync(dest);
                console.log(`Downloaded file size: ${stats.size} bytes`);
                if (stats.size > 0) {
                    return;
                } else {
                    throw new Error('Downloaded file size is 0 bytes.');
                }
            } catch (error) {
                console.error(`Error downloading file (attempt ${attempt}): ${error}`);
                if (attempt === retries) {
                    throw new Error(`Failed to download file after ${retries} attempts: ${url}`);
                }
            }
        }
    }

    private installApplication(installerPath: string, isStremio: boolean = false): Promise<void> {
        return new Promise((resolve, reject) => {
            const command = isStremio ? `"${installerPath}"` : `start "" "${installerPath}" /S`;
            exec(command, (err, stdout, stderr) => {
                if (err) {
                    reject(`Error installing application: ${stderr}`);
                } else {
                    resolve();
                }
            });
        });
    }

    public isApplicationInstalled(executablePath: string): boolean {
        return fs.existsSync(executablePath);
    }

    public async installDependencies(): Promise<{ stremio: boolean, qbittorrent: boolean }> {
        const installed = { stremio: false, qbittorrent: false };
        try {
            if (!this.isApplicationInstalled(this.stremioExecutablePath)) {
                console.log('Downloading Stremio installer...');
                const stremioHeaders = {
                    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                    "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
                    "cache-control": "no-cache",
                    "pragma": "no-cache",
                    "priority": "u=0, i",
                    "sec-ch-ua": "\"Chromium\";v=\"130\", \"Google Chrome\";v=\"130\", \"Not?A_Brand\";v=\"99\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"Windows\"",
                    "sec-fetch-dest": "document",
                    "sec-fetch-mode": "navigate",
                    "sec-fetch-site": "cross-site",
                    "sec-fetch-user": "?1",
                    "upgrade-insecure-requests": "1",
                    "Referer": "https://www.stremio.com/",
                    "Referrer-Policy": "origin"
                };
                await this.downloadFile(this.stremioInstallerUrl, this.stremioInstallerPath, stremioHeaders);
                console.log('Stremio installer downloaded to:', this.stremioInstallerPath);
                console.log('Installing Stremio...');
                await this.installApplication(this.stremioInstallerPath, true);
                console.log('Stremio installed at:', this.config.stremio.stremioAppPath);
                installed.stremio = true;
            } else {
                console.log('Stremio is already installed.');
                installed.stremio = true;
            }

            if (!this.isApplicationInstalled(this.qbittorrentExecutablePath)) {
                console.log('Downloading qBittorrent installer...');
                const qbittorrentHeaders = {
                    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                    "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
                    "cache-control": "no-cache",
                    "pragma": "no-cache",
                    "priority": "u=0, i",
                    "sec-ch-ua": "\"Chromium\";v=\"130\", \"Google Chrome\";v=\"130\", \"Not?A_Brand\";v=\"99\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"Windows\"",
                    "sec-fetch-dest": "document",
                    "sec-fetch-mode": "navigate",
                    "sec-fetch-site": "same-site",
                    "upgrade-insecure-requests": "1",
                    "cookie": "_ga=GA1.1.1688635505.1730644484; _ga_8F25LTGCYJ=GS1.1.1730649513.2.1.1730649523.50.0.0",
                    "Referer": "https://www.fosshub.com/",
                    "Referrer-Policy": "origin"
                };
                await this.downloadFile(this.qbittorrentInstallerUrl, this.qbittorrentInstallerPath, qbittorrentHeaders);
                console.log('qBittorrent installer downloaded to:', this.qbittorrentInstallerPath);
                console.log('Installing qBittorrent...');
                await this.installApplication(this.qbittorrentInstallerPath);
                console.log('qBittorrent installed at:', this.config.qbittorrent.qbittorrentInstallPath);
                installed.qbittorrent = true;
            } else {
                console.log('qBittorrent is already installed.');
                installed.qbittorrent = true;
            }

            console.log('Dependencies installed successfully.');
        } catch (error) {
            console.error('Error installing dependencies:', error);
        }
        return installed;
    }

    private uninstallApplication(executablePath: string, uninstallCommand: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.isApplicationInstalled(executablePath)) {
                exec(uninstallCommand, (err, stdout, stderr) => {
                    if (err) {
                        reject(`Error uninstalling application: ${stderr}`);
                    } else {
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    public async uninstallDependencies(): Promise<void> {
        try {
            console.log('Uninstalling Stremio...');
            await this.uninstallApplication(this.stremioExecutablePath, `"${this.stremioExecutablePath}" --uninstall`);
            console.log('Stremio uninstalled.');

            console.log('Uninstalling qBittorrent...');
            await this.uninstallApplication(this.qbittorrentExecutablePath, `"${this.qbittorrentExecutablePath}" --uninstall`);
            console.log('qBittorrent uninstalled.');

            console.log('Dependencies uninstalled successfully.');
        } catch (error) {
            console.error('Error uninstalling dependencies:', error);
        }
    }
}

export default Installer;