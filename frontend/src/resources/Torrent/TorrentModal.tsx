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

export default function BasicModal({open, setOpen, hash}: {open: boolean, setOpen: React.Dispatch<React.SetStateAction<boolean>>, hash: string}) {
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
        socket.on('torrent-added', (response) => {
            console.log(response);
            setSteps(prev => [...prev, 'Torrent added']);
            setProgress(progress + 16.66);
        });

        socket.on('torrent-checking', (response) => {
            console.log(response);
            setSteps(prev => [...prev, 'Torrent checking attempt ' + response.attempt + ' of ' + response.total]);
            setProgress(progress + 1.51);
        });

        socket.on('torrent-started', (response) => {
            console.log(response);
            setSteps(prev => [...prev, 'Download started']);
            setProgress(33.32);
        });

        socket.on('torrent-trackers', (response) => {
            console.log(response);
            setSteps(prev => [...prev, 'Torrent trackers found']);
            setProgress(progress + 16.66);
        });

        socket.on('torrent-files', (response) => {
            console.log(response);
            setSteps(prev => [...prev, 'Torrent files found']);

            const files = response.files.map((file: TorrentFile) => {                
                return { id: file.index, name: file.name, availability: file.availability, priority: file.priority, progress: file.progress, size: file.size };
            });
            
            setFiles(files);
            setProgress(progress + 16.66);
        });

        socket.on('torrent-paused', (response) => {
            console.log(response);
            setSteps(prev => [...prev, 'Download paused']);
            setProgress(100);
        });

        socket.on('torrent-resumed', (response) => {
            console.log(response);
            setSteps(prev => [...prev, 'Download resumed']);
        });

        socket.on('torrent-file-priority', (response) => {
            console.log(response);
            setSteps(prev => [...prev, 'Files priority set']);
            setDownloading(true);
        });

        socket.on('torrent-trackers', (response) => {
            console.log(response);
            setSteps(prev => [...prev, 'Trackers added']);
        });

        socket.on('torrent-status', (response) => {
            console.log(response);
            setSteps(prev => [...prev, `Torrent state is ${response.state} with download speed of ${response.dlspeed} and progress of ${response.progress * 100}%`]);
            setProgress(response.progress * 100);
        });

        // next do trackers and downloding speed and progress verification
        // something like get info from qbittorrent and update the progress bar

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
        };
    });
    
    const handleSelectedFiles = () => {
        const unselectedFileIndices = files.filter(file => !selectedFiles.includes(file.id)).map(file => file.id);
        socket.emit('set-torrent-fileprio', { hash, fileIndices: unselectedFileIndices, priority: 0 });
        setHideDataTable(true);
        setProgress(0);
    };

    const handleAddTrackers = () => {
        axios.post('http://localhost:3000/api/torrent/trackers', { hash }).then((response) => {
            console.log(response);
            setSteps(prev => [...prev, 'Trackers added']);
        }).catch((error) => {
            console.error(error);
            setAlert('Error getting torrent trackers');
            setAlertType('error');
        });
    };

    const handleRetry = () => {
        socket.emit('torrent-retry', { hash });
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
                {!hideDataTable && files && files.length > 0 && progress === 100 && (
                    <>
                        <DataTable columns={columns} rows={files} handle={setSelectedFiles}/>
                        <Button variant="contained" onClick={handleSelectedFiles} sx={{ mt: 2, float: 'right' }}>Download Selected Files</Button>
                    </>
                )}

                {alert && (
                    <Alert severity={alertType as AlertColor} sx={{ mt: 2 }}>{alert}</Alert>
                )}

                {downloading && (
                    <Grid container justifyContent={"flex-end"} spacing={2} sx={{ mt: 2 }}>
                        <Grid item>
                            <Button variant="contained" onClick={handleAddTrackers}>Add trackers</Button>
                        </Grid>
                        <Grid item>
                            <Button variant="contained" onClick={handleRetry}>Retry</Button>
                        </Grid>
                    </Grid>
                )}
            </Box>
        </Modal>
    );
}