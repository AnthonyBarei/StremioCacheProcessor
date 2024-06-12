import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';

export default function CheckboxList({items}: {items: string[]}) {    
  const [checked, setChecked] = React.useState([0]);

  const handleToggle = (value: number) => () => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
  };

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {items && items.map((item, index) => { console.log(index, item);
        const labelId = `checkbox-list-label-${index}`;

        return (
          <ListItem
            key={index}
            disablePadding
          >
            <ListItemButton role={undefined} onClick={handleToggle(index)} dense>
                <Checkbox
                  edge="start"
                  checked={checked.indexOf(index) !== -1}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{ 'aria-labelledby': labelId }}
                />
              <ListItemText id={labelId} primary={item} />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}
