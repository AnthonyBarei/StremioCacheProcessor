import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TextField, Button, Box, Typography, Grid, Alert, InputAdornment } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import MainLayout from './Layouts/Main';
import PlexStoragePathDataTable from './Plex/PlexStoragePathDataTable';
import IconButtonMenu from './Layouts/IconButtonMenu';

const Configuration = () => {
    const navigate = useNavigate();
    const [stremioCachePath, setStremioCachePath] = useState('');
    const [stremioAppHost, setstremioAppHost] = useState('');
    const [qbittorrentAppHost, setQbittorrentAppHost] = useState('');
    const [userSaveFolder, setUserSaveFolder] = useState('');
    const [stremioCheckTimeout, setStremioCheckTimeout] = useState('');
    const [stremioCheckRetries, setStremioCheckRetries] = useState('');
    const [plexAppHost, setPlexAppHost] = useState('');
    const [plexStorageHost, setPlexStorageHost] = useState('');
    const [plexStoragePath, setPlexStoragePath] = useState([]);
    const [alert, setAlert] = useState('');
    const [alertType, setAlertType] = useState('');

    useEffect(() => {
        getConfiguration();
    }, []);

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'ID'},
        { field: 'plexlocation', headerName: 'Plex Storage Path'},
        { field: 'location', headerName: 'Local Storage Path'},
        { field: 'action', headerName: 'Action',
            renderCell: (params) => (
                <IconButtonMenu items={[
                    {name: 'Edit', handle: () => editClient(params.row.id)},
                    {name: 'Delete', handle: () => deleteRow(params.row.id)},
                ]}/>
            ),
        },
    ];

    const editClient = (id: number) => {
        navigate(`/configuration/plex-storage-path/${id}`);
    };

    const deleteRow = (id: number) => {
        axios.delete(`http://localhost:3000/api/configuration/storage-path/${id}`).then(() => {
            setAlert('Storage path deleted');
            setAlertType('success');
            getConfiguration();
        }).catch((error) => {
            console.log(error.response.data);
            setAlert('Error deleting storage path');
            setAlertType('error');
        }); 
    };

    const getConfiguration = () => {
        axios.get('http://localhost:3000/api/configuration').then((response) => {
            const { 
                stremioCachePath, 
                stremioAppHost, 
                qbittorrentAppHost, 
                userSaveFolder, 
                stremioCheckTimeout, 
                stremioCheckRetries,
                plexAppHost,
                plexStorageHost,
                plexStoragePath,
            } = response.data;
            
            setStremioCachePath(stremioCachePath);
            setstremioAppHost(stremioAppHost);
            setQbittorrentAppHost(qbittorrentAppHost);
            setUserSaveFolder(userSaveFolder);
            setStremioCheckTimeout(stremioCheckTimeout);
            setStremioCheckRetries(stremioCheckRetries);
            setPlexAppHost(plexAppHost);
            setPlexStorageHost(plexStorageHost);            

            const rows = plexStoragePath.map(({path, plexPath} : {path: string, plexPath: string}, index: number) => {
                return { id: index, plexlocation: plexPath, location: path };
            });
            setPlexStoragePath(rows);
        }).catch((error) => {
            console.error(error);
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const data = { stremioCachePath, stremioAppHost, qbittorrentAppHost, userSaveFolder, stremioCheckTimeout, stremioCheckRetries };
        
        axios.post('http://localhost:3000/api/configuration', data).then((response) => {
            console.log(response);
            setAlert('Configuration saved');
            setAlertType('success');
        }).catch((error) => {
            console.error(error);
            setAlert('Error saving configuration');
            setAlertType('error');
        });
    };

    if (!stremioCachePath || !stremioAppHost || !qbittorrentAppHost || !userSaveFolder) return (
        <MainLayout>
            <Typography variant="h4" align="center" gutterBottom>Loading...</Typography>
        </MainLayout>
    );

    return (
        <MainLayout>
            <Typography variant="h4" align="center" gutterBottom>Configuration</Typography>
            <Typography variant="body1" align="center" sx={{ mb: 2 }}>Set the app requirements</Typography>

            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ display: 'flex', justifyContent: 'center'}}>
                <Grid container spacing={2} sx={{ width: {sm: '100%', lg: '50%'} }}>
                    <Grid item xs={12}>
                        <TextField
                            label="Stremio Cache Path"
                            value={stremioCachePath}
                            onChange={(e) => setStremioCachePath(e.target.value)}
                            fullWidth
                            size='small'
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Stremio App Host"
                            value={stremioAppHost}
                            onChange={(e) => setstremioAppHost(e.target.value)}
                            fullWidth
                            size='small'
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="qBittorrent App Host"
                            value={qbittorrentAppHost}
                            onChange={(e) => setQbittorrentAppHost(e.target.value)}
                            fullWidth
                            size='small'
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="User Save Folder"
                            value={userSaveFolder}
                            onChange={(e) => setUserSaveFolder(e.target.value)}
                            fullWidth
                            size='small'
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            type='number'
                            label="Stremio Check Timeout"
                            value={stremioCheckTimeout}
                            onChange={(e) => setStremioCheckTimeout(e.target.value)}
                            fullWidth
                            size='small'
                            InputProps={{
                                'endAdornment': <InputAdornment position="end">ms</InputAdornment>,
                            }}
                            helperText="Using a value too low can cause the app to crash or slow down your computer. Default is 30000ms."
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            type='number'
                            label="Stremio Check Retries"
                            value={stremioCheckRetries}
                            onChange={(e) => setStremioCheckRetries(e.target.value)}
                            fullWidth
                            size='small'
                            helperText="Using a value too high can cause the app to crash or slow down your computer. Default is 5."
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Plex App Host"
                            value={plexAppHost}
                            onChange={(e) => setPlexAppHost(e.target.value)}
                            fullWidth
                            size='small'
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Plex Storage Host"
                            value={plexStorageHost}
                            onChange={(e) => setPlexStorageHost(e.target.value)}
                            fullWidth
                            size='small'
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <PlexStoragePathDataTable columns={columns} rows={plexStoragePath} />
                        <Button variant="contained" sx={{ my: 2, float: 'right' }} component={Link} to="/configuration/plex-storage-path">Add Storage Path</Button>
                    </Grid>

                    {alert && (
                        <Grid item xs={12}>
                            <Alert severity={alertType as 'success' | 'error'}>{alert}</Alert>
                        </Grid>
                    )}

                    <Grid item xs={12}>
                        <Button type="submit" variant="contained" fullWidth sx={{ mb: 2 }}>
                            Save
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </MainLayout>
    );
};

export default Configuration;