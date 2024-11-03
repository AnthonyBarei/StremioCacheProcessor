import * as React from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import { Alert, AlertColor, Button, List, ListItem, ListItemButton, ListItemIcon, ListItemText, TextField, Typography } from '@mui/material';
import { FolderProcess, Meta } from '../../../../interfaces';
import { GridCheckCircleIcon } from '@mui/x-data-grid';
import axios from 'axios';

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

export default function AssociationModal({open, setOpen, metadata, setMeta, setTitle}: {
    open: boolean, 
    setOpen: React.Dispatch<React.SetStateAction<boolean>>, 
    metadata: FolderProcess
    setMeta: React.Dispatch<React.SetStateAction<Meta>>,
    setTitle: React.Dispatch<React.SetStateAction<string>>,
}) {
    const handleClose = () => setOpen(false);
    const [selected, setSelected] = React.useState<string>('' as string);
    const [alert, setAlert] = React.useState<string>('');
    const [alertType, setAlertType] = React.useState<string>('success');
    const [searchTerm, setSearchTerm] = React.useState('');

    React.useEffect(() => {
        if (!metadata.selectedMetadata) {
            setSelected(metadata.meta.videos[0].id);
        } else {
            setSelected(metadata.meta.videos.findIndex(video => video.id === metadata.selectedMetadata?.imdb_id).toString());
        }
    }, [metadata]);

    const handleSelectItem = (id: string) => {
        setSelected(id);
    };

    const handleApply = () => {
        axios.post('http://localhost:3000/api/association', {
            id: metadata.id,
            videoId: selected,
        }).then((response) => {
            setTitle(response.data.meta.name);
            setMeta(response.data.meta);
            setAlert(response.data.message);
            setAlertType('success');
        }).catch(error => {
            setAlert(error.response.data.message);
            setAlertType('error');
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
                <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ mb: 2 }}>Correct Association for {metadata.id}</Typography>

                <TextField 
                    type="text" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    label="Search" 
                    variant="outlined" 
                    size='small'
                    fullWidth 
                    sx={{ mb: 2 }} 
                />

                <List sx={{ height: '500px', overflow: 'auto', p: 2 }}>
                    {metadata.meta.videos.filter(video => video.title.includes(searchTerm)).map((video, index) => (
                        <ListItem 
                            key={index} 
                            onClick={() => handleSelectItem(video.id)}
                            sx={{
                                justifyContent: 'center',
                                backgroundImage: `url(${video.thumbnail})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                position: 'relative',
                                mb: 2,
                                height: 200,
                                border: video.id === selected ? (theme) => `2px solid ${theme.palette.primary.main}` : 'none',
                            }}
                            disablePadding
                        >
                            <div style={{
                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                left: 0,
                                right: 0
                            }} />
                            {video.id === selected && (
                                <ListItemIcon sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}>
                                    <GridCheckCircleIcon color='primary'/>
                                </ListItemIcon>
                            )}
                            <ListItemButton component="a" href="#simple-list" sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                height: '100%',
                                '&:hover': {
                                    color: 'white',
                                },
                            }}>
                                <ListItemText 
                                    primary={video.title} 
                                    secondary={`Published at: ${new Date(video.publishedAt).toLocaleDateString()}`} 
                                    sx={{ position: 'relative', zIndex: 1 }} 
                                />
                                <ListItemText 
                                    primary={`Info Hash: ${video.stream.infoHash}`} 
                                    secondary={`File Index: ${video.stream.fileIdx}`}
                                    sx={{ position: 'relative', zIndex: 1 }} 
                                />
                                {video.season && video.episode && (
                                    <ListItemText 
                                        primary={`Season: ${video.season}`} 
                                        secondary={`Episode: ${video.episode}`}
                                        sx={{ position: 'relative', zIndex: 1 }}
                                    />
                                )}
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>

                {alert && <Alert severity={alertType as AlertColor} sx={{mt: 2}}>{alert}</Alert>}
                
                <Button onClick={handleApply} variant="contained" sx={{ mt: 2, float: 'right' }}>Apply</Button>
            </Box>
        </Modal>
    );
}