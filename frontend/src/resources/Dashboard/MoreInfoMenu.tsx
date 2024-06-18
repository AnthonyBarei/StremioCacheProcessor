import * as React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import IconButton from '@mui/material/IconButton';

export default function MoreInfoMenu() {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <IconButton 
                aria-label="More Info" 
                sx={{ borderRadius: '10%' }} 
                aria-controls={open ? 'basic-menu' : undefined} 
                aria-haspopup="true" aria-expanded={open ? 'true' : undefined} 
                onClick={handleClick}
            >
                    <ExpandMoreIcon />
                </IconButton>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                'aria-labelledby': 'basic-button',
                }}
            >
                <MenuItem onClick={handleClose}>Kill all processes</MenuItem>
                <MenuItem onClick={handleClose}>Change association</MenuItem>
                <MenuItem onClick={handleClose}>Show Metadata</MenuItem>
            </Menu>
        </>
    );
}
