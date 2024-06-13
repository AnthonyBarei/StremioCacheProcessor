import { useEffect, useState } from "react";
import { Box, Typography, Alert, Divider, } from "@mui/material";
import { FolderProcess, StremioStateFolderProcess } from "../../../../interfaces";
import { socket } from "../../socket";

import { AlertColor } from "@mui/material";

import Modal from '@mui/material/Modal';
import StremioState from "./StremioState";

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
  maxHeight: '90vh',
  overflowY: 'auto',
};

export default function StremioModal({ metadata, open, setOpen, stremioState, setStremioState, waiting, setWaiting, copied, setCopied, downloaded, setDownloaded }: { 
    metadata: FolderProcess, 
    open: boolean, 
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
    stremioState: StremioStateFolderProcess,
    setStremioState: React.Dispatch<React.SetStateAction<StremioStateFolderProcess>>
    waiting: boolean,
    setWaiting: React.Dispatch<React.SetStateAction<boolean>>
    copied: boolean,
    setCopied: React.Dispatch<React.SetStateAction<boolean>>
    downloaded: boolean,
    setDownloaded: React.Dispatch<React.SetStateAction<boolean>>
}) {
    const handleClose = () => setOpen(false);
    const [steps, setSteps] = useState<string[]>([]);
    const [alert, setAlert] = useState<string>('');
    const [alertType, setAlertType] = useState<string>('');

    useEffect(() => {                
        socket.on('meta-resync', (response: StremioStateFolderProcess) => {  
            if (response.id != metadata.id) return;
            if (waiting) setWaiting(false);
            setDownloaded(response.downloaded);
            setStremioState(response);
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
    }, [metadata.id, downloaded, setCopied, steps, waiting, setDownloaded, setStremioState, setWaiting]);

    

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

                <StremioState 
                    metadata={metadata} 
                    stremioState={stremioState} 
                    waiting={waiting} 
                    setWaiting={setWaiting} 
                    downloaded={downloaded} 
                    copied={copied} 
                />

                {alert && (
                    <Alert severity={alertType as AlertColor} sx={{ mt: 2 }}>{alert}</Alert>
                )}
            </Box>
        </Modal>
    );
}