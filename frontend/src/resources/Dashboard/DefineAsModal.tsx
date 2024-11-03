import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import { GridCheckCircleIcon } from '@mui/x-data-grid';
import axios from 'axios';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 800,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    maxHeight: '90vh',
    overflowY: 'auto',
};

export default function DefineAsModal({open, setOpen, type, id}: {open: boolean, setOpen: React.Dispatch<React.SetStateAction<boolean>>, type: string, id: string}) {
    const handleClose = () => setOpen(false);
    const [selectedType, setSelectedType] = React.useState<string>('' as string);
    const [userSaveFolder, setUserSaveFolder] = React.useState<string>('' as string);

    React.useEffect(() => {
        setSelectedType(type);
        getUserSaveFolder();
    }, [type]);

    const getUserSaveFolder = () => {
        axios.get('http://localhost:3000/api/configuration/userSaveFolder').then(response => {
            setUserSaveFolder(response.data.userSaveFolder);
        }).catch(error => {
            console.error(error);
        });
    };

    const handleSelectType = (type: string) => {
        axios.patch('http://localhost:3000/api/type', { folder: id, type: type }).then(() => {
            setSelectedType(type);
        }).catch(error => {
            console.error(error);
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
          <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ mb: 2 }}>Select media type for {id}</Typography>

          <List>
            {['films', 'series'].map((value) => (
                <ListItem key={value} onClick={() => handleSelectType(value)} secondaryAction={
                    selectedType === value ? <Box sx={{ display: 'flex', alignItems: 'center' }}><GridCheckCircleIcon color="primary"/></Box> : ''
                } disablePadding>
                    <ListItemButton>
                        <ListItemText primary={`${value} (${userSaveFolder}\\${value})`} sx={{ textTransform: 'capitalize' }}/>
                    </ListItemButton>
                </ListItem>
            ))}
          </List>
        </Box>
      </Modal>
  );
}
