import React, { useState, useEffect } from 'react';
import { TextField, Button, Select, MenuItem, FormControl, InputLabel, Box, Grid } from '@mui/material';
import MainLayout from '../Layouts/Main';
import axios from 'axios';
import { Library, RowLibrary } from '../../../../interfaces';
import { GridColDef } from '@mui/x-data-grid';
import Alert, { AlertColor } from '@mui/material/Alert';

import PlexDataTable from './PlexDataTable';

const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'location', headerName: 'Location', width: 200, },
    { field: 'title', headerName: 'Title', width: 150 },
    { field: 'agent', headerName: 'Agent', width: 150 },
];

const PlexStoragePathCreate: React.FC = () => {
    const [plexLibrariesPath, setPlexLibrariesPath] = useState([] as string[]);
    const [libraries, setLibraries] = useState<RowLibrary[]>([]);
    const [alert, setAlert] = useState('');
    const [alertType, setAlertType] = useState('');

    useEffect(() => {
        getPlexLibraries();
    }, []);

    const getPlexLibraries = async () => {
        // Perform API GET request here
        axios.get('http://localhost:3000/api/plex/libraries').then((response) => {
            console.log(response.data);

            const librariesPath = [] as string[];

            const libraries = response.data.libraries.MediaContainer.Directory.map((library: Library) => {
                librariesPath.push(library.Location[0].path);
                return { id: library.key, location: library.Location[0].path, title: library.title, agent: library.agent };
            });
            
            setPlexLibrariesPath(librariesPath);
            setLibraries(libraries);
        }).catch((error) => {
            console.error(error);
        });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        const data = new FormData(event.target as HTMLFormElement);
        const path = data.get('path') as string;
        const plexPath = data.get('plexPath') as string;

        if (!path || !plexPath) {
            setAlert('Please fill in all fields');
            setAlertType('error');
            return;
        }

        const selectedLibrary = libraries.find((library) => library.location === plexPath);

        const postData = {
            key: selectedLibrary?.id,
            path,
            plexPath,
            title: selectedLibrary?.title,
        };

        axios.post('http://localhost:3000/api/configuration/storage-path', postData).then((response) => {
            console.log(response.data);
            setAlert('Storage Path Created');
            setAlertType('success');
        }).catch((error) => {
            console.error(error);
            setAlert(error.response.data.message);
            setAlertType('error');
        });
    };

    return (
        <MainLayout>
            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ display: 'flex', justifyContent: 'center'}}>
                <Grid container spacing={2} sx={{ width: {sm: '100%', lg: '50%'} }}>

                    {libraries.length > 0 && (
                        <Grid item xs={12}>
                            <PlexDataTable columns={columns} rows={libraries} handle={() => {}}/>
                        </Grid>
                    )}

                    <Grid item xs={12}>
                        <TextField
                            label="Path"
                            required
                            fullWidth
                            size='small'
                            name='path'
                            autoFocus
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <FormControl required fullWidth
                            size='small'>
                            <InputLabel>Plex Path</InputLabel>
                            <Select name="plexPath">
                                {plexLibrariesPath.map((library) => (
                                    <MenuItem key={library} value={library}>{library}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {alert && (
                        <Grid item xs={12}>
                            <Box>
                                <Alert severity={alertType as AlertColor}>{alert}</Alert>
                            </Box>
                        </Grid>
                    )}

                    <Grid item xs={12}>
                        <Button type="submit" variant="contained" color="primary" fullWidth sx={{mb: 2}}>
                            Submit
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </MainLayout>
    );
};

export default PlexStoragePathCreate;