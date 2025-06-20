import * as React from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import { Alert, Button, Divider, Typography, Grid } from '@mui/material';
import { GridColDef, GridRenderCellParams, GridRowId } from '@mui/x-data-grid';
import DataTable from './TorrentDataTable';
import { RowFile, TorrentFile, GridCellExpandProps } from '../../../../interfaces';
import GridCellExpand from '../Layouts/GridCellExpand';
import axios from 'axios';
import { AlertColor } from '@mui/material/Alert';
import { useSocket } from '../../providers/socketProvider';
import TorrentState from './TorrentState';


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

const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', width: 200, 
        renderCell: (params: GridRenderCellParams<GridCellExpandProps, string>) => (
            <GridCellExpand value={params.value || ''} width={300} />
        ), 
    },
    { field: 'availability', headerName: 'Availability', type: 'number', width: 150 },
    { field: 'priority', headerName: 'Priority', type: 'number', width: 150 },
    { field: 'progress', headerName: 'Progress', type: 'number', width: 150 },
    { field: 'size', headerName: 'Size', type: 'number', width: 150 },
];

export default function TorrentModal({hash, open, setOpen, added, setAdded, waiting, setWaiting, progress, setProgress, downloading, setDownloading, downloaded, setDownloaded}: {
    hash: string
    open: boolean, 
    setOpen: React.Dispatch<React.SetStateAction<boolean>>, 
    added: boolean,
    setAdded: React.Dispatch<React.SetStateAction<boolean>>,
    waiting: boolean,
    setWaiting: React.Dispatch<React.SetStateAction<boolean>>,
    progress: number,
    setProgress: React.Dispatch<React.SetStateAction<number>>,
    downloading: boolean,
    setDownloading: React.Dispatch<React.SetStateAction<boolean>>,
    downloaded: boolean,
    setDownloaded: React.Dispatch<React.SetStateAction<boolean>>,
}) {
    const handleClose = () => setOpen(false);
    const [steps, setSteps] = React.useState<string[]>([]);
    const [files, setFiles] = React.useState<RowFile[]>([]);
    const [selectedFiles, setSelectedFiles] = React.useState<GridRowId[]>([]);
    const [hideDataTable, setHideDataTable] = React.useState<boolean>(false);
    const [alert, setAlert] = React.useState<string>('');
    const [alertType, setAlertType] = React.useState<string>('');
    const [trackersAdded, setTrackersAdded] = React.useState<boolean>(false);

    const { socket } = useSocket();

    const handleTorrentAdded = React.useCallback((response: {hash: string, message: string}) => {
        console.log(response, response.hash === hash);
        
        if (response.hash !== hash) return;
        setAdded(true);
        setSteps(prev => [response.message, ...prev]);
        setProgress(progress + 16.66);
    }, [hash, progress, setAdded, setProgress]);

    React.useEffect(() => {
        socket.on('torrent-added', handleTorrentAdded);

        return () => {
            socket.off('torrent-added', handleTorrentAdded);
        };
    }, [handleTorrentAdded, socket]);

    const handleTorrentChecking = React.useCallback((response: {hash: string, message: string}) => {
        if (response.hash !== hash) return;
        setSteps(prev => [response.message, ...prev]);
        setProgress(progress + 1.51);
    }, [hash, progress, setProgress]);

    React.useEffect(() => {
        socket.on('torrent-checking', handleTorrentChecking);

        return () => {
            socket.off('torrent-checking', handleTorrentChecking);
        };
    }, [handleTorrentChecking, socket]);

    const handleTorrentStarted = React.useCallback((response: {hash: string, message: string}) => {
        if (response.hash !== hash) return;
        setSteps(prev => [response.message, ...prev]);
        setProgress(33.32);
    }, [hash, setProgress]);

    React.useEffect(() => {
        socket.on('torrent-started', handleTorrentStarted);

        return () => {
            socket.off('torrent-started', handleTorrentStarted);
        };
    }, [handleTorrentStarted, socket]);

    const handleTorrentTrackers = React.useCallback((response: {hash: string, message: string}) => {
        if (response.hash !== hash) return;
        setSteps(prev => [response.message, ...prev]);
        setProgress(progress + 16.66);
    }, [hash, progress, setProgress]);

    React.useEffect(() => {
        socket.on('torrent-trackers', handleTorrentTrackers);

        return () => {
            socket.off('torrent-trackers', handleTorrentTrackers);
        };
    }, [handleTorrentTrackers, socket]);

    const handleTorrentFiles = React.useCallback((response: {hash: string, files: TorrentFile[], message: string}) => {
        if (response.hash !== hash) return;
        setSteps(prev => [response.message, ...prev]);

        const files = response.files.map((file: TorrentFile) => {                
            return { id: file.index, name: file.name, availability: file.availability, priority: file.priority, progress: file.progress, size: file.size };
        });
        
        setFiles(files);
        setProgress(progress + 16.66);
        setWaiting(false);
    }, [hash, progress, setProgress, setWaiting]);

    React.useEffect(() => {
        socket.on('torrent-files', handleTorrentFiles);

        return () => {
            socket.off('torrent-files', handleTorrentFiles);
        };
    }, [handleTorrentFiles, socket]);

    const handleTorrentPaused = React.useCallback((response: {hash: string, message: string}) => {
        if (response.hash !== hash) return;
        setSteps(prev => [response.message, ...prev]);
        setProgress(100);
        setWaiting(false);
    }, [hash, setProgress, setWaiting]);

    React.useEffect(() => {
        socket.on('torrent-paused', handleTorrentPaused);

        return () => {
            socket.off('torrent-paused', handleTorrentPaused);
        };
    }, [handleTorrentPaused, socket]);

    const handleTorrentResumed = React.useCallback((response: {hash: string, message: string}) => {
        if (response.hash !== hash) return;
        setSteps(prev => [response.message, ...prev]);
    }, [hash]);

    React.useEffect(() => {
        socket.on('torrent-resumed', handleTorrentResumed);

        return () => {
            socket.off('torrent-resumed', handleTorrentResumed);
        };
    }, [handleTorrentResumed, socket]);

    const handleTorrentFilePriority = React.useCallback((response: {hash: string, message: string}) => {
        if (response.hash !== hash) return;
        setSteps(prev => [response.message, ...prev]);
    }, [hash]);

    React.useEffect(() => {
        socket.on('torrent-file-priority', handleTorrentFilePriority);

        return () => {
            socket.off('torrent-file-priority', handleTorrentFilePriority);
        };
    }, [handleTorrentFilePriority, socket]);

    const handleTorrentStatus = React.useCallback((response: {hash: string, progress: number, downloading: boolean, message: string}) => {
        if (response.hash !== hash) return;
        setSteps(prev => [response.message, ...prev]);
        setProgress(response.progress);
        setDownloading(response.downloading);
        setWaiting(false);
    }, [hash, setDownloading, setProgress, setWaiting]);

    React.useEffect(() => {
        socket.on('torrent-status', handleTorrentStatus);

        return () => {
            socket.off('torrent-status', handleTorrentStatus);
        };
    }, [handleTorrentStatus, socket]);

    const handleTorrentError = React.useCallback((response: {hash: string, message: string}) => {
        if (response.hash !== hash) return;
        setSteps(prev => ['Error: ' + response.message, ...prev]);
        setAlert(response.message);
        setAlertType('error');
    }, [hash]);

    React.useEffect(() => {
        socket.on('torrent-error', handleTorrentError);

        return () => {
            socket.off('torrent-error', handleTorrentError);
        };
    }, [handleTorrentError, socket]);

    const handleTorrentDeleted = React.useCallback((response: {hash: string, message: string}) => {
        if (response.hash !== hash) return;
        setSteps(prev => [response.message, ...prev]);
        setAdded(false);
        setOpen(false);
        setProgress(0);
        setWaiting(false);
    }, [hash, setAdded, setOpen, setProgress, setWaiting]);

    React.useEffect(() => {
        socket.on('torrent-deleted', handleTorrentDeleted);

        return () => {
            socket.off('torrent-deleted', handleTorrentDeleted);
        };
    }, [handleTorrentDeleted, socket]);

    const handleTorrentDownloaded = React.useCallback((response: {hash: string, message: string}) => {
        if (response.hash !== hash) return;
        setSteps(prev => [response.message, ...prev]);
        setDownloaded(true);
        setProgress(100);
        setDownloading(false);
        setWaiting(false);
    }, [hash, setDownloaded, setDownloading, setProgress, setWaiting]);

    React.useEffect(() => {
        socket.on('torrent-downloaded', handleTorrentDownloaded);

        return () => {
            socket.off('torrent-downloaded', handleTorrentDownloaded);
        };
    }, [handleTorrentDownloaded, socket]);
    
    const handleSelectedFiles = () => {
        console.log('dont click this');
        
        const unselectedFileIndices = files.filter(file => !selectedFiles.includes(file.id)).map(file => file.id);
        socket.emit('set-torrent-fileprio', { hash, fileIndices: unselectedFileIndices, priority: 0 });
        setHideDataTable(true);
        setProgress(0);
    };

    const handleAddTrackers = () => {
        setWaiting(true);

        axios.post('http://localhost:3000/api/torrent/trackers', { hash }).then((response) => {
            setSteps(prev => [response.data.message, ...prev]);
            setTrackersAdded(true);
            setAlert(response.data.message);
            setAlertType('success');
            setWaiting(false);
        }).catch((error) => {
            setAlert(error.message);
            setAlertType('error');
            setWaiting(false);
        });
    };

    const handleRetry = () => {
        setWaiting(true);
        socket.emit('torrent-debug', { hash });
    };

    const handleDelete = () => {
        const confirmDelete = window.confirm('Are you sure you want to delete this torrent ?');
        if (!confirmDelete) return;
        const confirmRemoveFiles = window.confirm('Do you want to remove the downloaded files ?');
        setWaiting(true);
        socket.emit('torrent-delete', { hash, removeFiles: confirmRemoveFiles });
    };

    const handlePlay = () => {
        setWaiting(true);

        axios.get(`http://localhost:3000/api/torrent/watch?hash=${hash}`).then(() => {
            setSteps(prev => ['Playing file', ...prev]);
            setAlert('Playing file');
            setAlertType('success');
            setWaiting(false);
        }).catch((err) => {
            setAlert(err.message);
            setAlertType('error');
            setWaiting(false);
        });
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={style}>
                <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ mb: 2 }}>{hash}</Typography>
                <Box sx={{ border: "1px solid #515151;", borderRadius: 1, p: 1, height: "300px", overflowY: 'scroll', overflowX: 'none', display: 'flex', flexDirection: 'column-reverse' }}>
                    {steps.length > 0 && steps.map((step, index) => <Typography key={index} variant='body1' component="div">{step}</Typography>)}
                </Box>

                <Divider sx={{ my: 2 }}/>

                {alert && (
                    <Alert severity={alertType as AlertColor} sx={{ my: 2, width: '100%' }}>{alert}</Alert>
                )}

                {!hideDataTable && files && files.length > 0 && progress === 100 && (
                    <>
                        <DataTable columns={columns} rows={files} handle={setSelectedFiles}/>
                        <Button variant="contained" onClick={handleSelectedFiles} sx={{ mt: 2, float: 'right' }}>Download Selected Files</Button>
                    </>
                )}

                <TorrentState
                    hash={hash} 
                    progress={progress} 
                    downloading={downloading}
                    added={added} 
                    waiting={waiting} 
                    setWaiting={setWaiting} 
                    downloaded={downloaded} 
                />

                {added && (
                    <Grid container justifyContent={"flex-end"} spacing={2} sx={{ mt: 2 }}>
                        <Grid item>
                            <Button variant="contained" onClick={handleDelete}>Delete</Button>
                        </Grid>
                        {!trackersAdded && !downloaded && (
                            <Grid item>
                                <Button variant="contained" onClick={handleAddTrackers}>Add trackers</Button>
                            </Grid>
                        )}
                        {files && files.length < 1 && !downloaded && !waiting && (
                            <Grid item>
                                <Button variant="contained" onClick={handleRetry}>Retry</Button>
                            </Grid>
                        )}
                        {downloaded && !waiting && (
                            <Grid item>
                                <Button variant="contained" onClick={handlePlay}>Play File</Button>
                            </Grid>
                        )}
                    </Grid>
                )}
            </Box>
        </Modal>
    );
}