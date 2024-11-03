import { useCallback, useEffect, useState } from "react";
import { Box, Typography, Alert, Divider, } from "@mui/material";
import { FolderProcess, StremioStateFolderProcess } from "../../../../interfaces";

import { AlertColor } from "@mui/material";
import Modal from '@mui/material/Modal';

import StremioState from "./StremioState";
import { useSocket } from "../../providers/socketProvider";

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

export default function StremioModal({ metadata, open, setOpen, stremioState, setStremioState, waiting, setWaiting, copied, setCopied, downloaded, setDownloaded, openDefineAs }: { 
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
    setDownloaded: React.Dispatch<React.SetStateAction<boolean>>,
    openDefineAs: React.Dispatch<React.SetStateAction<boolean>>,
}) {
    const handleClose = () => setOpen(false);
    const [steps, setSteps] = useState<string[]>([]);
    const [alert, setAlert] = useState<string>('');
    const [alertType, setAlertType] = useState<string>('');

    const { socket } = useSocket();

    const handleMetaResync = useCallback((response: StremioStateFolderProcess) => {
        if (response.id != metadata.id) return;
        if (waiting) setWaiting(false);
        setDownloaded(response.downloaded);
        setStremioState(response);
        setSteps(['Resynched.', ...steps]);
    }, [metadata.id, waiting, setWaiting, setDownloaded, setStremioState, steps]);

    useEffect(() => {                
        socket.on('meta-resync', handleMetaResync);

        return () => {
            socket.off('meta-resync', handleMetaResync);
        };
    }, [handleMetaResync, socket]);

    const handleStremioError = useCallback((response: { hash: string, message: string }) => {
        if (response.hash != metadata.id) return;
        setSteps([response.message, ...steps]);
        setAlert(response.message);
        setAlertType('error');
        setWaiting(false);
    }, [metadata.id, setWaiting, steps]);

    useEffect(() => {      
        socket.on('stremio-error', handleStremioError);

        return () => {
            socket.off('stremio-error', handleStremioError);
        };
    }, [handleStremioError, socket]);

    const handleStremioCheckEnd = useCallback((response: { hash: string }) => {
        if (response.hash != metadata.id) return;
        setSteps(['Check ended.', ...steps]);
        setWaiting(false);
    }, [metadata.id, steps, setWaiting]);

    useEffect(() => {      
        socket.on('stremio-check-end', handleStremioCheckEnd);

        return () => {
            socket.off('stremio-check-end', handleStremioCheckEnd);
        };
    }, [handleStremioCheckEnd, socket]);

    const handleStremioCheckInfo = useCallback((response: { hash: string, message: string }) => {
        if (response.hash != metadata.id) return;
        setSteps([response.message, ...steps]);
    }, [metadata.id, steps]);

    useEffect(() => {      
        socket.on('stremio-check-info', handleStremioCheckInfo);

        return () => {
            socket.off('stremio-check-info', handleStremioCheckInfo);
        };
    }, [handleStremioCheckInfo, socket]);

    const handleStremioCopying = useCallback((response: { hash: string, message: string }) => {
        if (response.hash != metadata.id) return;
        setSteps([response.message, ...steps]);
        setWaiting(true);
        setAlert('');
    }, [metadata.id, steps, setWaiting]);

    useEffect(() => {      
        socket.on('stremio-copying', handleStremioCopying);

        return () => {
            socket.off('stremio-copying', handleStremioCopying);
        };
    }, [handleStremioCopying, socket]);

    const handleStremioCopied = useCallback((response: { hash: string, message: string }) => {
        if (response.hash != metadata.id) return;
        setSteps(['File copied.', ...steps]);
        setWaiting(false);
        setAlert(response.message);
        setAlertType('success');
        setCopied(true);
    }, [metadata.id, steps, setCopied, setWaiting]);

    useEffect(() => {      
        socket.on('stremio-copied', handleStremioCopied);

        return () => {
            socket.off('stremio-copied', handleStremioCopied);
        };
    }, [handleStremioCopied, socket]);

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
                    openDefineAs={openDefineAs}
                />

                {alert && (
                    <Alert severity={alertType as AlertColor} sx={{ mt: 2 }}>{alert}</Alert>
                )}
            </Box>
        </Modal>
    );
}