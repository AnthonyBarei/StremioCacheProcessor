interface Trailer {
    source: string;
    type: string;
}

interface Stream {
    infoHash: string;
    fileIdx: string;
    title: string;
    sources: object|null;
}

interface Video {
    id: string;
    title: string;
    publishedAt: string;
    released: string;
    stream: Stream;
    thumbnail: string;
}

interface Movie {
    cast: Array<string>;
    description: string;
    director: Array<string>;
    genre: Array<string>;
    imdbRating: string;
    imdb_id: string;
    name: string;
    poster: string;
    runtime: string;
    trailers: Array<Trailer>;
    background: string;
    logo: string;
    genres: Array<string>;
    releaseInfo: string;
    id: string;
    type: string;
    videos: Array<Video>;
}

interface StremioStateFolderProcess {
    name: string;
    downloaded: boolean;
    downloadSize: number;
    downloadSpeed: number;
    remainingTime: number | null;
    progress: number;
    size: number;
    downloading: boolean;
    title: string;
}

interface StremioStateFolderProcessResync {
    id: string;
    name: string;
    downloaded: boolean;
    downloadSize: number;
    downloadSpeed: number;
    remainingTime: number | null;
    progress: number;
    size: number;
    downloading: boolean;
    title: string;
}

interface StremioFolderProcess {
    stremioState: StremioStateFolderProcess;
    stremioDownloaded: boolean;
    stremioCopied: boolean;
}

interface qBittorrentStateFolderProcess {
    qbittorrentDownloaded: boolean;
    qbittorrentState: null;
}

interface FolderProcess {
    id: string;
    meta: Movie;
    stremio: StremioFolderProcess;
    qbittorrent: qBittorrentStateFolderProcess;
}

interface TorrentFile {
    index: number;
    name: string;
    availability: number;
    priority: number;
    progress: number;
    size: number;
}

interface RowFile {
    id: number;
    name: string;
    availability: number;
    priority: number;
    progress: number;
    size: number;
}

interface GridCellExpandProps {
    value: string;
    width: number;
}

interface TorrentInfo {
    added_on: number,
    amount_left: number,
    auto_tmm: boolean,
    availability: number,
    category: string,
    completed: number,
    completion_on: number,
    content_path: string,
    dl_limit: number,
    dlspeed: number,
    download_path: string,
    downloaded: number,
    downloaded_session: number,
    eta: number,
    f_l_piece_prio: boolean,
    force_start: boolean,
    hash: string,
    inactive_seeding_time_limit: number,
    infohash_v1: string,
    infohash_v2: string,
    last_activity: number,
    magnet_uri: string,
    max_inactive_seeding_time: number,
    max_ratio: number,
    max_seeding_time: number,
    name: string,
    num_complete: number,
    num_incomplete: number,
    num_leechs: number,
    num_seeds: number,
    priority: number,
    progress: number,
    ratio: number,
    ratio_limit: number,
    save_path: string,
    seeding_time: number,
    seeding_time_limit: number,
    seen_complete: number,
    seq_dl: boolean,
    size: number,
    state: string,
    super_seeding: boolean,
    tags: string,
    time_active: number,
    total_size: number,
    tracker: string,
    trackers_count: number,
    up_limit: number,
    uploaded: number,
    uploaded_session: number,
    upspeed: number
}

interface LibraryLocation {
    id: number;
    path: string;
}

interface Library {
    allowSync: boolean,
    art: string,
    composite: string,
    filters: boolean,
    refreshing: boolean,
    thumb: string,
    key: string,
    type: string,
    title: string,
    agent: string,
    scanner: string,
    language: string,
    uuid: string,
    updatedAt: number,
    createdAt: number,
    scannedAt: number,
    content: boolean,
    directory: boolean,
    contentChangedAt: number,
    hidden: number,
    Location: LibraryLocation[]
}

interface RowLibrary {
    id: number;
    location: string;
    title: string;
    agent: string;
}

interface ConfigurationLibrary {
    key: string;
    path: string;
    plexPath: string;
    title: string;
}

export type { 
    Movie,
    FolderProcess,
    TorrentFile,
    GridCellExpandProps,
    RowFile,
    TorrentInfo,
    StremioStateFolderProcess,
    StremioStateFolderProcessResync,
    Library,
    RowLibrary,
    ConfigurationLibrary,
};
