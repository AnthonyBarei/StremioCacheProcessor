import * as React from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import LinearWithValueLabel from '../Layouts/Linear';
import { Alert, Button, Divider, Typography, Grid } from '@mui/material';
import { socket } from '../../socket';
import { GridColDef, GridRenderCellParams, GridRowId } from '@mui/x-data-grid';
import DataTable from './TorrentDataTable';
import { RowFile, TorrentFile, GridCellExpandProps } from '../../../../interfaces';
import GridCellExpand from '../Layouts/GridCellExpand';
import axios from 'axios';
import { AlertColor } from '@mui/material/Alert';


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

export default function TorrentModal({hash, open, setOpen, added, setAdded, downloaded, setDownloaded}: {
    hash: string
    open: boolean, 
    setOpen: React.Dispatch<React.SetStateAction<boolean>>, 
    added: boolean,
    setAdded: React.Dispatch<React.SetStateAction<boolean>>,
    downloaded: boolean,
    setDownloaded: React.Dispatch<React.SetStateAction<boolean>>,
}) {
    const handleClose = () => setOpen(false);
    const [steps, setSteps] = React.useState<string[]>([]);
    const [progress, setProgress] = React.useState<number>(0);
    const [files, setFiles] = React.useState<RowFile[]>([]);
    const [selectedFiles, setSelectedFiles] = React.useState<GridRowId[]>([]);
    const [hideDataTable, setHideDataTable] = React.useState<boolean>(false);
    const [alert, setAlert] = React.useState<string>('');
    const [alertType, setAlertType] = React.useState<string>('');
    const [downloading, setDownloading] = React.useState<boolean>(false);

    React.useEffect(() => {
        socket.on('torrent-added', (response: {hash: string, message: string}) => {
            if (response.hash !== hash) return;
            setAdded(true);
            setSteps(prev => [response.message, ...prev]);
            setProgress(progress + 16.66);
        });

        socket.on('torrent-checking', (response: {hash: string, message: string}) => {
            if (response.hash !== hash) return;
            setSteps(prev => [response.message, ...prev]);
            setProgress(progress + 1.51);
        });

        socket.on('torrent-started', (response: {hash: string, message: string}) => {
            if (response.hash !== hash) return;
            setSteps(prev => [response.message, ...prev]);
            setProgress(33.32);
        });

        socket.on('torrent-trackers', (response: {hash: string, message: string}) => { // TODO: emit this event from the backend
            if (response.hash !== hash) return;
            setSteps(prev => [response.message, ...prev]); // 'Torrent trackers found'
            setProgress(progress + 16.66);
        });

        socket.on('torrent-files', (response: {hash: string, files: TorrentFile[], message: string}) => {
            if (response.hash !== hash) return;
            setSteps(prev => [response.message, ...prev]);

            const files = response.files.map((file: TorrentFile) => {                
                return { id: file.index, name: file.name, availability: file.availability, priority: file.priority, progress: file.progress, size: file.size };
            });
            
            setFiles(files);
            setProgress(progress + 16.66);
        });

        socket.on('torrent-paused', (response: {hash: string, message: string}) => {
            if (response.hash !== hash) return;
            setSteps(prev => [response.message, ...prev]);
            setProgress(100);
        });

        socket.on('torrent-resumed', (response: {hash: string, message: string}) => {
            if (response.hash !== hash) return;
            setSteps(prev => [response.message, ...prev]);
        });

        socket.on('torrent-file-priority', (response: {hash: string, message: string}) => {
            if (response.hash !== hash) return;
            setSteps(prev => [response.message, ...prev]);
            setDownloading(true);
        });

        socket.on('torrent-trackers', (response: {hash: string, message: string}) => { // TODO: emit this event from the backend
            if (response.hash !== hash) return;
            setSteps(prev => [response.message, ...prev]); // 'Trackers added'
        });

        socket.on('torrent-status', (response: {hash: string, progress: number, message: string}) => {
            if (response.hash !== hash) return;
            setSteps(prev => [response.message, ...prev]);
            setProgress(response.progress * 100);
        });

        socket.on('torrent-error', (response: {hash: string, message: string}) => {
            if (response.hash !== hash) return;
            setSteps(prev => ['Error: ' + response.message, ...prev]);
            setAlert(response.message);
            setAlertType('error');
        });

        socket.on('torrent-deleted', (response: {hash: string, message: string}) => {
            if (response.hash !== hash) return;
            setSteps(prev => [response.message, ...prev]);
            setAdded(false);
            setOpen(false);
            setProgress(0);
        });

        socket.on('torrent-downloaded', (response: {hash: string, message: string}) => {
            if (response.hash !== hash) return;
            setSteps(prev => [response.message, ...prev]);
            setDownloaded(true);
            setProgress(100);
        });

        return () => {
            socket.off('torrent-added');
            socket.off('torrent-checking');
            socket.off('torrent-started');
            socket.off('torrent-trackers');
            socket.off('torrent-files');
            socket.off('torrent-paused');
            socket.off('torrent-resumed');
            socket.off('torrent-file-priority');
            socket.off('torrent-trackers');
            socket.off('torrent-status');
            socket.off('torrent-error');
            socket.off('torrent-deleted');
            socket.off('torrent-downloaded');
        };
    }, [hash, progress, setAdded, setDownloaded, setOpen]);
    
    const handleSelectedFiles = () => {
        console.log('dont click this');
        
        const unselectedFileIndices = files.filter(file => !selectedFiles.includes(file.id)).map(file => file.id);
        socket.emit('set-torrent-fileprio', { hash, fileIndices: unselectedFileIndices, priority: 0 });
        setHideDataTable(true);
        setProgress(0);
    };

    const handleAddTrackers = () => {
        axios.post('http://localhost:3000/api/torrent/trackers', { hash }).then((response) => {
            console.log(response);
            setSteps(prev => ['Trackers added', ...prev]);
        }).catch((error) => {
            console.error(error);
            setAlert('Error getting torrent trackers');
            setAlertType('error');
        });
    };

    const handleRetry = () => {
        socket.emit('torrent-retry', { hash });
    };

    const handleDelete = () => {
        socket.emit('torrent-delete', { hash });
    };

    const handlePlay = () => {

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

                <Box sx={{ mb: 2 }}>
                    <LinearWithValueLabel progress={progress}/>
                </Box>
 
                {alert && (
                    <Alert severity={alertType as AlertColor} sx={{ my: 2, width: '100%' }}>{alert}</Alert>
                )}

                {!hideDataTable && files && files.length > 0 && progress === 100 && (
                    <>
                        <DataTable columns={columns} rows={files} handle={setSelectedFiles}/>
                        <Button variant="contained" onClick={handleSelectedFiles} sx={{ mt: 2, float: 'right' }}>Download Selected Files</Button>
                    </>
                )}

                {added && (
                    <Grid container justifyContent={"flex-end"} spacing={2} sx={{ mt: 2 }}>
                        <Grid item>
                            <Button variant="contained" onClick={handleDelete}>Delete</Button>
                        </Grid>
                        {downloading && !downloaded && (
                            <Grid item>
                                <Button variant="contained" onClick={handleAddTrackers}>Add trackers</Button>
                            </Grid>
                        )}
                        {files && files.length < 1 && (
                            <Grid item>
                                <Button variant="contained" onClick={handleRetry}>Retry</Button>
                            </Grid>
                        )}
                        {downloaded && (
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