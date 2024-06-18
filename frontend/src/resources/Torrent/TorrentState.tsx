import { Box, Button, Typography } from "@mui/material";
import { socket } from "../../socket";
import LinearWithValueLabel from "../Layouts/Linear";
import LinearIndeterminate from "../Layouts/LinearIndeterminate";


const TorrentState = ({ hash, progress, downloading, added, waiting, setWaiting, downloaded }: { 
    hash: string,
    progress: number, 
    downloading: boolean,
    added: boolean,
    waiting: boolean,
    setWaiting: React.Dispatch<React.SetStateAction<boolean>>,
    downloaded: boolean 
}) => {
    const handleRetry = () => {
        if (downloaded) return;
        socket.emit('torrent-check', { hash });
        setWaiting(true);
    };
    
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <Typography variant="body2" component="div">Folder: {hash}</Typography>

            {added && (
                <>
                    <Typography variant="body2" component="div">Torrent added.</Typography>

                    {!downloaded && !waiting && (
                        <Box sx={{mt: 2}}>
                            {!downloading && (
                                <Button variant="contained" onClick={handleRetry} fullWidth>Resync Torrent State</Button>
                            )}

                            {downloading && (
                                <Box sx={{ mb: 2 }}>
                                    <LinearWithValueLabel progress={progress}/>
                                </Box>   
                            )}
                        </Box>
                    )}

                    {downloaded && (
                        <Typography variant="body2" component="div">File(s) Downloaded.</Typography>
                    )}
                </>
            )}

            {!added && (
                <Typography variant="body2" component="div">No active torrents.</Typography>
            )}

            {waiting && (
                <Box sx={{ mt: 2 }}>
                    <LinearIndeterminate/>
                </Box>
            )}
        </Box>
    );
};

export default TorrentState;