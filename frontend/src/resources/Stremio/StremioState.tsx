import { useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { FolderProcess, StremioStateFolderProcessResync } from "../../../../interfaces";
import { socket } from "../../socket";
import LinearWithValueLabel from "../Layouts/Linear";
import LinearIndeterminate from "../Layouts/LinearIndeterminate";

function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const StremioState = ({ metadata, copied, downloaded }: { metadata: FolderProcess, copied: boolean, downloaded: boolean }) => {
    const [downloading, setDownloading] = useState(false);
    const [downloadSize, setDownloadSize] = useState(0);
    const [downloadSpeed, setDownloadSpeed] = useState(0);
    const [size, setSize] = useState(0);
    const [progress, setProgress] = useState(0);
    const [waiting, setWaiting] = useState(false);

    useEffect(() => {        
        socket.on('meta-resync', (response: StremioStateFolderProcessResync) => {  
            if (response.id == metadata.id) {
                if (waiting) setWaiting(false);
                
                setDownloading(response.downloading);
                setDownloadSize(response.downloadSize);
                setDownloadSpeed(response.downloadSpeed);
                setSize(response.size);
                setProgress(response.progress);
            }
        });

        return () => {
            socket.off('meta-resync');
        };
    }, [metadata.id, metadata.stremio.stremioDownloaded, waiting]);

    useEffect(() => {
        if (!downloaded) socket.emit('stremio-metacheck', { id: metadata.id, meta: metadata.meta });
    }, [metadata.id, metadata.meta, downloaded]);

    const handleCheckDownload = () => {
        socket.emit('stremio-metacheck', { id: metadata.id, meta: metadata.meta });
        setWaiting(true);
    };
    
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <Typography variant="body2" component="div">Folder: {metadata.id}</Typography>
            {downloaded && (
                <>
                    <Typography variant="body2" component="div">File Downloaded.</Typography>
                    {copied && (
                        <Typography variant="body2" component="div">File Copied.</Typography>
                    )}
                </>
            )}

            {!downloaded && (
                <>
                    {!downloading && (
                        <>
                            <Typography variant="body2" component="div">No active downloads.</Typography>
                            <Button variant="contained" onClick={() => handleCheckDownload()} sx={{mt:2}}>Check Download</Button>
                        </>
                    )}
        
                    {downloading && (
                        <>
                            <Typography variant="body2" component="div">Stream speed: {formatBytes(downloadSpeed)}</Typography>
                            <Typography variant="body2" component="div">Cached: {formatBytes(downloadSize)} / {progress}%</Typography>
                            <Typography variant="body2" component="div">Total size: {formatBytes(size)}</Typography>
                            <LinearWithValueLabel progress={progress}/>  
                        </>
                    )}
                </>
            )}

            {waiting && (
                <LinearIndeterminate/>   
            )}
        </Box>
    );
};

export default StremioState;