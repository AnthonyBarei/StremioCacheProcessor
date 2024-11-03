import * as React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import IconButton from '@mui/material/IconButton';
import { Tooltip } from '@mui/material';

export default function MoreInfoMenu({openMetadata, openAssociation, openDefineAs}: {
    openMetadata: React.Dispatch<React.SetStateAction<boolean>>, 
    openAssociation: React.Dispatch<React.SetStateAction<boolean>>,
    openDefineAs: React.Dispatch<React.SetStateAction<boolean>>,
}) {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    const handleShowMetadata = () => {
        openMetadata(true);
        setAnchorEl(null);
    };
    const handleCorrectAssociation = () => {
        openAssociation(true);
        setAnchorEl(null);
    };
    const handleDefineAs = () => {
        openDefineAs(true);
        setAnchorEl(null);
    };

    return (
        <>
            <Tooltip title="More Info" placement="top">
                <IconButton 
                    aria-label="More Info" 
                    sx={{ borderRadius: '10%' }} 
                    aria-controls={open ? 'basic-menu' : undefined} 
                    aria-haspopup="true" aria-expanded={open ? 'true' : undefined} 
                    onClick={handleClick}
                >
                    <ExpandMoreIcon />
                </IconButton>
            </Tooltip>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
            >
                <MenuItem onClick={handleDefineAs}>Define as</MenuItem>
                <MenuItem onClick={handleCorrectAssociation}>Correct the association</MenuItem>
                <MenuItem onClick={handleShowMetadata}>Show Metadata</MenuItem>
            </Menu>
        </>
    );
}
