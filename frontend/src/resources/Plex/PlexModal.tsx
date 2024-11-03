import * as React from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import LinearWithValueLabel from '../Layouts/Linear';
import { Alert, Button, Divider, Typography } from '@mui/material';
import { AlertColor } from '@mui/material/Alert';
import { GridColDef, GridRowId } from '@mui/x-data-grid';

import { ConfigurationLibrary, Folder, RowLibrary } from '../../../../interfaces';
import PlexDataTable from './PlexDataTable';
import { useSocket } from '../../providers/socketProvider';
import TreeView from '../Layouts/TreeView';
import Loading from '../Layouts/Loading';

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
    const [selectedLibrary, setSelectedLibrary] = React.useState<RowLibrary>(false as unknown as RowLibrary);
    const [hideDataTable, setHideDataTable] = React.useState<boolean>(false);
    const [LibraryFolders, setLibraryFolders] = React.useState<Folder[]>([]);
    const [waitingForLibraryFolders, setWaitingForLibraryFolders] = React.useState<boolean>(false);
    const [waitingForCopy, setWaitingForCopy] = React.useState<boolean>(false);
    const [selectedFolderPath, setSelectedFolderPath] = React.useState<string>('' as string);
    const [hideLibraryFolders, setHideLibraryFolders] = React.useState<boolean>(false);

    const { socket } = useSocket();

    React.useEffect(() => {
        if (!open) return;

        setSteps([]);
        setProgress(0);
        setAlert('');
        setAlertType('');
        setLibraries([]);
        setSelectedLibraries([]);
        setSelectedLibrary(false as unknown as RowLibrary);
        setHideDataTable(false);
        setLibraryFolders([]);
        setWaitingForLibraryFolders(false);
        setWaitingForCopy(false);
        setSelectedFolderPath('' as string);
        setHideLibraryFolders(false);

        socket.emit('get-plex-libraries', { hash });
    }, [hash, open, socket]);

    const handlePlexLibraries = React.useCallback((response: {hash: string, plexStoragePath: ConfigurationLibrary[]}) => {
        if (response.hash !== hash) return;
        setSteps(prev => ['Plex libraries updated.', ...prev]);

        const libraries = response.plexStoragePath.map((library: ConfigurationLibrary) => {                
            return { id: library.key, plexpath: library.plexPath, localpath: library.path, title: library.title } as unknown as RowLibrary;
        });
        
        setLibraries(libraries);
        setProgress(progress + 100/3);
        setHideDataTable(false);
    }, [hash, progress]);

    React.useEffect(() => {
        socket.on('plex-libraries', handlePlexLibraries);

        return () => {
            socket.off('plex-libraries', handlePlexLibraries);
        };
    }, [handlePlexLibraries, socket]);

    const handlePlexCopied = React.useCallback((response: {hash: string, message: string}) => {
        if (response.hash !== hash) return;
        setSteps(prev => ['Plex copied.', ...prev]);
        setHideLibraryFolders(true);
        setAlert(response.message);
        setAlertType('success');
        setProgress(progress + 100/3);
        setWaitingForCopy(false);
    }, [hash, progress]);

    React.useEffect(() => {
        socket.on('plex-copied', handlePlexCopied);

        return () => {
            socket.off('plex-copied', handlePlexCopied);
        };
    }, [handlePlexCopied, socket]);

    const handlePlexScanned = React.useCallback((response: {hash: string, message: string}) => {
        if (response.hash !== hash) return;
        setSteps(prev => ['Plex library scanned.', ...prev]);
        setAlert(response.message);
        setAlertType('success');
        setHideDataTable(true);
        setProgress(100);
    }, [hash]);

    React.useEffect(() => {
        socket.on('plex-scanned', handlePlexScanned);

        return () => {
            socket.off('plex-scanned', handlePlexScanned);
        };
    }, [handlePlexScanned, socket]);

    const handleLibraryContent = React.useCallback((response: {hash: string, content: Folder[]}) => {
        if (response.hash !== hash) return;
        setSteps(prev => ['Library content fetched.', ...prev]);
        setLibraryFolders(response.content);
        setWaitingForLibraryFolders(false);
    }, [hash]);

    React.useEffect(() => {
        socket.on('plex-library-content', handleLibraryContent);

        return () => {
            socket.off('plex-library-content', handleLibraryContent);
        };
    }, [handleLibraryContent, socket]);

    const handlePlexError = React.useCallback((response: {hash: string, message: string}) => {
        if (response.hash !== hash) return;
        setSteps(prev => ['Plex error detected.', ...prev]);
        setAlert(response.message);
        setAlertType('error');
        setWaitingForLibraryFolders(false);
        setHideDataTable(false);
    }, [hash]);

    React.useEffect(() => {
        socket.on('plex-error', handlePlexError);

        return () => {
            socket.off('plex-error', handlePlexError);
        };
    }, [handlePlexError, socket]);


    const handleSelectedLibraries = () => {    
        if (selectedLibraries.length > 1)  {
            setAlert('Please select only one library'); 
            return; 
        }

        const libraryContent = libraries.find((library) => library.id === selectedLibraries[0]);
        if (!libraryContent) {
            setAlert('Library not found');
            return;
        }

        setSelectedLibrary(libraryContent);
        setSelectedFolderPath(libraryContent.localpath || '');
        setHideDataTable(true);
        setWaitingForLibraryFolders(true);
        setSteps(prev => ['Fetching Library Content. This Might Take a While...', ...prev]);

        const confirmForceLibraryCheck = window.confirm('Do you want to force a library check?');

        socket.emit('plex-get-library-content', { hash, key: selectedLibraries[0], force: confirmForceLibraryCheck});
    };

    const handleCopy = () => {
        socket.emit('plex-copy', { hash, library: selectedLibrary.id, path: selectedFolderPath });
        setWaitingForCopy(true);
    }

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
                        <Button variant="contained" onClick={handleSelectedLibraries} sx={{ mt: 2, float: 'right' }}>Select Library</Button>
                    </>
                )}

                {!hideLibraryFolders && !waitingForLibraryFolders && LibraryFolders.length > 0 && (
                    <>
                        <Typography variant='body1' component='div' sx={{ mb: 2 }}>
                            {selectedLibrary.title} {' '}
                            <a href={selectedFolderPath} target="_blank" rel="noopener noreferrer">{selectedFolderPath}</a>
                        </Typography>
                        <Box sx={{ border: "1px solid #515151;", borderRadius: 1, p: 1, height: "300px", overflowY: 'scroll', overflowX: 'none',}}>
                            <TreeView folders={LibraryFolders} rootPath={selectedLibrary.localpath || ''} setPath={setSelectedFolderPath}/>
                        </Box>
                        <Button variant="contained" onClick={handleCopy} sx={{ mt: 2, float: 'right' }}>Copy media to selected library</Button>
                    </>
                )}

                {waitingForLibraryFolders && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                        <Loading/>
                    </Box>
                )}

                {waitingForCopy && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                        <Loading/>
                    </Box>
                )}

                {alert && (
                    <Alert severity={alertType as AlertColor} sx={{ mt: 2 }}>{alert}</Alert>
                )}
            </Box>
        </Modal>
    );
}