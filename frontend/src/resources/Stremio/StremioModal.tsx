import { useEffect, useState } from "react";
import { Box, Button, Typography, Alert, Divider, } from "@mui/material";
import { FolderProcess, StremioStateFolderProcessResync } from "../../../../interfaces";
import { socket } from "../../socket";
import LinearWithValueLabel from "../Layouts/Linear";
import LinearIndeterminate from "../Layouts/LinearIndeterminate";

import { AlertColor } from "@mui/material";

import Modal from '@mui/material/Modal';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 1000,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function StremioModal({ metadata, open, setOpen, copied, setCopied, downloaded, setDownloaded }: { 
    metadata: FolderProcess, 
    open: boolean, 
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
    copied: boolean,
    setCopied: React.Dispatch<React.SetStateAction<boolean>>
    downloaded: boolean,
    setDownloaded: React.Dispatch<React.SetStateAction<boolean>>
}) {
    const handleClose = () => setOpen(false);
    const [steps, setSteps] = useState<string[]>([]);
    const [alert, setAlert] = useState<string>('');
    const [alertType, setAlertType] = useState<string>('');

    const [downloading, setDownloading] = useState(false);
    const [downloadSize, setDownloadSize] = useState(0);
    const [downloadSpeed, setDownloadSpeed] = useState(0);
    const [size, setSize] = useState(0);
    const [progress, setProgress] = useState(0);
    const [waiting, setWaiting] = useState(false);

    useEffect(() => {        
        socket.on('meta-resync', (response: StremioStateFolderProcessResync) => {  
            if (response.id != metadata.id) return;
            if (waiting) setWaiting(false);
            
            setDownloading(response.downloading);
            setDownloadSize(response.downloadSize);
            setDownloadSpeed(response.downloadSpeed);
            setSize(response.size);
            setProgress(response.progress);
            setDownloaded(response.downloaded);

            setSteps(['Resynched.', ...steps]);
        });

        socket.on('stremio-error', (response: { hash: string, message: string }) => {
            if (response.hash != metadata.id) return;
            setSteps([response.message, ...steps]);
            setAlert(response.message);
            setAlertType('error');
        });

        socket.on('stremio-check-end', (response: { hash: string }) => {
            if (response.hash != metadata.id) return;
            setSteps(['Check ended.', ...steps]);
            setWaiting(false);
        });

        socket.on('stremio-check-info', (response: { hash: string, message: string }) => {
            if (response.hash != metadata.id) return;
            setSteps([response.message, ...steps]);
        });

        socket.on('stremio-copying', (response: { hash: string, message: string }) => {
            if (response.hash != metadata.id) return;
            setSteps([response.message, ...steps]);
            setWaiting(true);
            setAlert('');
        });

        socket.on('stremio-copied', (response: { hash: string, message: string }) => {
            if (response.hash != metadata.id) return;
            setSteps(['File copied.', ...steps]);
            setWaiting(false);
            setAlert(response.message);
            setAlertType('success');
            setCopied(true);
        });

        return () => {
            socket.off('meta-resync');
            socket.off('stremio-error');
            socket.off('stremio-check-end');
            socket.off('stremio-check-info');
            socket.off('stremio-copying');
            socket.off('stremio-copied');
        };
    }, [metadata.id, downloaded, setCopied, steps, waiting, setDownloaded]);

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
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={style}>
                <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ mb: 2 }}>{metadata.id}</Typography>
                <Box sx={{ border: "1px solid #515151;", borderRadius: 1, p: 1, height: "300px", overflowY: 'scroll', overflowX: 'none', display: 'flex', flexDirection: 'column-reverse' }}>
                    {steps.length > 0 && steps.map((step, index) => <Typography key={index} variant='body1' component="div">{step}</Typography>)}
                </Box>
                <Divider sx={{ my: 2 }}/>

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
                        {!downloading && (
                            <>
                                <Typography variant="body2" component="div" sx={{ mb: 2 }}>No active downloads.</Typography>
                                <Button variant="contained" onClick={() => handleResync()} fullWidth>Resync Cache State</Button>
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

                {alert && (
                    <Alert severity={alertType as AlertColor} sx={{ mt: 2 }}>{alert}</Alert>
                )}
            </Box>
        </Modal>
    );
}