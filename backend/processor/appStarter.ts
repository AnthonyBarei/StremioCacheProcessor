import axios from 'axios';
import { exec, execSync } from 'child_process';
import CONFIG from '../config';
import Installer from './installer';

class AppStarter {
    private installer: Installer;

    constructor() {
        this.installer = new Installer(CONFIG);
    }

    public async checkServer(url: string, name: string): Promise<boolean> {
        try {
            await axios.get(url);
            console.log(`${name} server is running.`);
            return true;
        } catch (error) {
            console.error(`Could not connect to ${name} server`);
            return false;
        }
    }

    private isProcessRunning(processName: string): boolean {
        try {
            const result = execSync(`tasklist /FI "IMAGENAME eq ${processName}" /FO CSV /NH`).toString();
            return result.includes(processName);
        } catch (error) {
            console.error(`Error checking if process is running: ${error}`);
            return false;
        }
    }

    private startApplication(executablePath: string, name: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            exec(`start "" "${executablePath}"`, (err, stdout, stderr) => {
                if (err) {
                    console.error(`Error starting ${name}: ${stderr}`);
                    reject(err);
                } else {
                    console.log(`${name} started successfully.`);
                    resolve();
                }
            });
        });
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async retryCheckServer(url: string, name: string, retries: number, delayMs: number): Promise<boolean> {
        for (let attempt = 1; attempt <= retries; attempt++) {
            const running = await this.checkServer(url, name);
            if (running) {
                return true;
            }
            console.log(`Retrying to check ${name} server (${attempt}/${retries})...`);
            await this.delay(delayMs);
        }
        return false;
    }

    public async initializeApplications(): Promise<boolean> {
        const stremioInstalled = this.installer.isApplicationInstalled(CONFIG.stremio.stremioAppPath);
        const qbittorrentInstalled = this.installer.isApplicationInstalled(CONFIG.qbittorrent.qbittorrentAppPath);

        if (stremioInstalled && qbittorrentInstalled) {
            console.log('Stremio and qBittorrent are installed.');
            const stremioRunning = await this.checkServer(CONFIG.stremio.stremioAppHost, 'Stremio');
            const qbittorrentRunning = await this.checkServer(CONFIG.qbittorrent.qBittorrentAppHost, 'qBittorrent');

            if (!stremioRunning) {
                await this.startApplication(CONFIG.stremio.stremioAppPath, 'Stremio');
            }
            if (!qbittorrentRunning && !this.isProcessRunning('qbittorrent.exe')) {
                await this.startApplication(CONFIG.qbittorrent.qbittorrentAppPath, 'qBittorrent');
            }

            // Retry checking the server status every 5 seconds up to 5 times
            const stremioRunningAfterStart = await this.retryCheckServer(CONFIG.stremio.stremioAppHost, 'Stremio', 5, 5000);
            const qbittorrentRunningAfterStart = await this.retryCheckServer(CONFIG.qbittorrent.qBittorrentAppHost, 'qBittorrent', 5, 5000);

            if (stremioRunningAfterStart && qbittorrentRunningAfterStart) {
                return true;
            } else {
                console.error('One or more servers failed to start.');
                return false;
            }
        } else {
            console.log('Installing dependencies...');
            const installed = await this.installer.installDependencies();
            if (installed.stremio && installed.qbittorrent) {
                console.log('All dependencies installed.');
                return true;
            } else {
                console.error('Failed to install all dependencies.');
                return false;
            }
        }
    }
}

export default AppStarter;
