import { Box, Button, Typography } from "@mui/material";
import { FolderProcess, StremioStateFolderProcess } from "../../../../interfaces";
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

const StremioState = ({ metadata, stremioState, waiting, setWaiting, copied, downloaded }: { 
    metadata: FolderProcess,
    stremioState: StremioStateFolderProcess, 
    waiting: boolean,
    setWaiting: React.Dispatch<React.SetStateAction<boolean>>,
    copied: boolean, 
    downloaded: boolean 
}) => {
    const handleResync = () => {
        if (downloaded) return;
        socket.emit('stremio-metacheck', { id: metadata.id, meta: metadata.meta });
        setWaiting(true);
    };

    const handleCopy = () => {
        if (!downloaded) return;
        socket.emit('stremio-copy', { id: metadata.id });
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
                    {!waiting && !copied && (
                        <Button variant="contained" onClick={handleCopy} sx={{ mt: 2 }}>Copy Cache Files to Local path</Button>
                    )}
                </>
            )}

            {!downloaded && (
                <>
                    {!stremioState.downloading && (
                        <>
                            <Typography variant="body2" component="div" sx={{ mb: 2 }}>No active downloads.</Typography>
                            <Button variant="contained" onClick={() => handleResync()} fullWidth>Resync Cache State</Button>
                        </>
                    )}
        
                    {stremioState.downloading && (
                        <>
                            <Typography variant="body2" component="div">Stream speed: {formatBytes(stremioState.downloadSpeed)}</Typography>
                            <Typography variant="body2" component="div">Cached: {formatBytes(stremioState.downloadSize)} / {stremioState.progress}%</Typography>
                            <Typography variant="body2" component="div">Total size: {formatBytes(stremioState.size)}</Typography>
                            <LinearWithValueLabel progress={stremioState.progress}/>  
                        </>
                    )}
                </>
            )}


            {waiting && (
                <Box sx={{ mt: 2}}>
                    <LinearIndeterminate/>   
                </Box>
            )}
        </Box>
    );
};

export default StremioState;