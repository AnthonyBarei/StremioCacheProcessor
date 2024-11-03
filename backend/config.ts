import * as os from 'os';
import * as path from 'path';

// Application parameters
const userHomePath = os.homedir();
const userSaveFolder = path.join(userHomePath, 'Videos');

const projectDir = 'C:\\Users\\Antho\\Documents\\code\\js\\stremio-cache-processor\\';
const stremioInstallPath = path.join(projectDir, 'stremio');
const stremioAppPath = 'C:\\Users\\Antho\\AppData\\Local\\Programs\\LNV\\Stremio-4\\stremio.exe';
const stremioCachePath = path.join(userHomePath, 'AppData', 'Roaming', 'stremio', 'stremio-server', 'stremio-cache');
const stremioAppHost = 'http://127.0.0.1:11470';
const stremioGithubUrl = 'https://dl.strem.io/shell-win/v4.4.168/Stremio+4.4.168.exe';

const qbittorrentInstallPath = path.join(projectDir, 'qbittorrent');
const qbittorrentAppPath = path.join(qbittorrentInstallPath, 'qbittorrent.exe');
const qBittorrentAppHost = 'http://localhost:8080';
const qbittorrentApi = qBittorrentAppHost + '/api/v2';
const qbittorrentCredentials = 'username=admin&password=aragorn95';
const qbittorrentGithubUrl = 'https://download.fosshub.com/Protected/expiretime=1730699524;badurl=aHR0cHM6Ly93d3cuZm9zc2h1Yi5jb20vcUJpdHRvcnJlbnQuaHRtbA==/69134d012c99f2ed9069d8f736a0bf0113dc6335224a3f486c1e581ed1bcbf80/5b8793a7f9ee5a5c3e97a3b2/672005fbeeeeed04938b37dd/qbittorrent_5.0.1_x64_setup.exe';

const nvidiaShieldProIP = '192.168.1.5';
const plexAppHost = `http://${nvidiaShieldProIP}:32400`;
const plexStorageHost = '\\\\' + nvidiaShieldProIP;

const CONFIG = {
    user: {
        userHomePath,
        userSaveFolder,
    },
    stremio: {
        stremioInstallPath,
        stremioAppPath,
        stremioCachePath,
        stremioAppHost,
        stremioGithubUrl,
        checkTimeout: 30000,
        checkRetries: 5,
    },
    qbittorrent: {
        qbittorrentInstallPath,
        qbittorrentAppPath,
        qBittorrentAppHost,
        qbittorrentApi,
        qbittorrentCredentials,
        qbittorrentGithubUrl,
    },
    plex: {
        plexAppHost: plexAppHost,
        plexStorageHost: plexStorageHost,
        plexStoragePath: [
            {
                "key": "2",
                "path": "\\\\192.168.1.5\\pny 1\\NVIDIA_SHIELD\\Films",
                "plexPath": "/storage/20AE47E8AE47B4D6/NVIDIA_SHIELD/Films",
                "title": "Films - 1"
            },
            {
                "key": "1",
                "path": "\\\\192.168.1.5\\pny 2\\NVIDIA_SHIELD\\Films",
                "plexPath": "/storage/442A93432A9330C2/NVIDIA_SHIELD/Films",
                "title": "Films - 2"
            },
            {
                "key": "3",
                "path": "\\\\192.168.1.5\\Micron 5200 1\\NVIDIA_SHIELD\\Series",
                "plexPath": "/storage/BA8A34588A3412FD/NVIDIA_SHIELD/Series",
                "title": "Séries"
            }
        ],
        plexToken: 'VX4BJeB58WYGyuxDUaXq',
        plexMetadataCommand: path.join('C:', 'Users', 'Antho', 'Documents', 'code', 'python', 'Plex-Meta-Manager', 'venv', 'Scripts', 'python.exe') + ' ' + path.join('C:', 'Users', 'Antho', 'Documents', 'code', 'python', 'Plex-Meta-Manager', 'kometa.py') + ' --run',
    }
};

export default CONFIG;