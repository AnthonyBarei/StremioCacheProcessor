import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';

export default function LinearIndeterminate({color='primary'}: {color?: "inherit" | "secondary" | "primary" | "error" | "info" | "success" | "warning"}) {
  return (
    <Box sx={{ width: '100%' }}>
      <LinearProgress color={color}/>
    </Box>
  );
}