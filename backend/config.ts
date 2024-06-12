import * as os from 'os';
import * as path from 'path';

// Application parameters
const userHomePath = os.homedir();
const userSaveFolder = path.join(userHomePath, 'Videos');

const stremioAppPath = path.join(userHomePath, 'AppData', 'Local', 'Programs', 'LNV', 'Stremio-4', 'stremio.exe');
const stremioCachePath = path.join(userHomePath, 'AppData', 'Roaming', 'stremio', 'stremio-server', 'stremio-cache');
const stremioAppHost = 'http://127.0.0.1:11470';

const qbittorrentAppPath = path.join('C:', 'Program Files', 'qBittorrent', 'qbittorrent.exe');
const qBittorrentAppHost = 'http://localhost:8080';
const qbittorrentApi = qBittorrentAppHost + '/api/v2';
const qbittorrentCredentials = 'username=admin&password=aragorn95';

const nvidiaShieldProIP = '192.168.1.5';
const plexAppHost = `http://${nvidiaShieldProIP}:32400`;
const plexStorageHost = '\\\\' + nvidiaShieldProIP;

const CONFIG = {
    user: {
        userHomePath,
        userSaveFolder,
    },
    stremio: {
        stremioAppPath,
        stremioCachePath,
        stremioAppHost,
        checkTimeout: 30000,
        checkRetries: 5,
    },
    qbittorrent: {
        qbittorrentAppPath,
        qBittorrentAppHost,
        qbittorrentApi,
        qbittorrentCredentials,
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
        // plexMetadataCommand: 'C:\Users\Antho\Documents\code\python\Plex-Meta-Manager\venv\Scripts\python.exe C:\Users\Antho\Documents\code\python\Plex-Meta-Manager\kometa.py --run'
        plexMetadataCommand: path.join('C:', 'Users', 'Antho', 'Documents', 'code', 'python', 'Plex-Meta-Manager', 'venv', 'Scripts', 'python.exe') + ' ' + path.join('C:', 'Users', 'Antho', 'Documents', 'code', 'python', 'Plex-Meta-Manager', 'kometa.py') + ' --run',
    }
};

export default CONFIG;