import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface Item {
  handle: () => void;
  name: string;
}

interface IconButtonMenuProps {
  items: Item[];
}

export default function IconButtonMenu({items}: IconButtonMenuProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleItemClick = (itemHandle: () => void) => {
    itemHandle();
    setAnchorEl(null);
  };

  return (
    <div>
      <IconButton
        aria-label="more"
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        onClick={handleClick}
      >
        <MoreVertIcon/>
      </IconButton>
      <Menu
        id="basic-menu"
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {items && items.map((item, idx) => (
          <MenuItem key={idx} onClick={() => handleItemClick(item.handle)}>{item.name}</MenuItem>
        ))}
      </Menu>
    </div>
  );
}