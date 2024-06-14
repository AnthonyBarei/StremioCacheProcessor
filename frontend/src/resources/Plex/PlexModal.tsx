import * as React from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import LinearWithValueLabel from '../Layouts/Linear';
import { Alert, Button, Divider, Typography } from '@mui/material';
import { AlertColor } from '@mui/material/Alert';
import { GridColDef, GridRowId } from '@mui/x-data-grid';

import { ConfigurationLibrary, RowLibrary } from '../../../../interfaces';
import PlexDataTable from './PlexDataTable';
import { useSocket } from '../../providers/socketProvider';


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
    { field: 'plexpath', headerName: 'Plex Storage Path', width: 200, },
    { field: 'localpath', headerName: 'Local Storage Path', width: 150 },
    { field: 'title', headerName: 'Title', width: 150 },
];

export default function PlexModal({open, setOpen, hash}: {open: boolean, setOpen: React.Dispatch<React.SetStateAction<boolean>>, hash: string}) {
    const handleClose = () => setOpen(false);
    const [steps, setSteps] = React.useState<string[]>([]);
    const [progress, setProgress] = React.useState<number>(0);
    const [alert, setAlert] = React.useState<string>('');
    const [alertType, setAlertType] = React.useState<string>('');
    const [libraries, setLibraries] = React.useState<RowLibrary[]>([]);
    const [selectedLibraries, setSelectedLibraries] = React.useState<GridRowId[]>([]);
    const [hideDataTable, setHideDataTable] = React.useState<boolean>(false);

    const { socket } = useSocket();

    const handlePlexLibraries = React.useCallback((response: {hash: string, plexStoragePath: ConfigurationLibrary[]}) => {
        if (response.hash !== hash) return;
        setSteps(prev => ['Plex libraries updated.', ...prev]);

        const libraries = response.plexStoragePath.map((library: ConfigurationLibrary) => {                
            return { id: library.key, plexpath: library.plexPath, localpath: library.path, title: library.title } as unknown as RowLibrary;
        });
        
        setLibraries(libraries);
        setProgress(progress + 100/3);
    }, [hash, progress]);

    React.useEffect(() => {
        socket.on('plex-libraries', handlePlexLibraries);

        return () => {
            socket.off('plex-libraries', handlePlexLibraries);
        };
    }, [handlePlexLibraries, socket]);

    // TODO !!!

    React.useEffect(() => {

        socket.on('plex-copied', (response) => {
            if (response.hash !== hash) return;
            setSteps(prev => ['Plex copied.', ...prev]);
            setAlert(response.message);
            setAlertType('success');
            setProgress(progress + 100/3);
        });

        socket.on('plex-scanned', (response) => {
            if (response.hash !== hash) return;
            setSteps(prev => ['Plex library scanned.', ...prev]);
            setAlert(response.message);
            setAlertType('success');
            setHideDataTable(true);
            setProgress(100);
        });

        socket.on('plex-error', (response) => {
            if (response.hash !== hash) return;
            setSteps(prev => ['Plex error detected.', ...prev]);
            setAlert(response.message);
            setAlertType('error');
        });

        return () => {
            socket.off('plex-librairies');
            socket.off('plex-copied');
            socket.off('plex-scanned');
            socket.off('plex-metadata-info');
            socket.off('plex-metadata-done');
            socket.off('plex-error');
        };
    });

    const handleSelectedLibraries = () => {    
        if (selectedLibraries.length > 1)  {
            setAlert('Please select only one library'); 
            return; 
        }        

        socket.emit('plex-copy', { hash, library: selectedLibraries[0] });
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

                {!hideDataTable && libraries.length > 0 && (
                    <>
                        <PlexDataTable columns={columns} rows={libraries} handle={setSelectedLibraries}/>
                        <Button variant="contained" onClick={handleSelectedLibraries} sx={{ mt: 2, float: 'right' }}>Copy media to selected library</Button>
                    </>
                )}

                {alert && (
                    <Alert severity={alertType as AlertColor} sx={{ mt: 2 }}>{alert}</Alert>
                )}
            </Box>
        </Modal>
    );
}