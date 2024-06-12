import { Link as RouterLink } from 'react-router-dom';
import { Box, Link, Typography } from '@mui/material';

export default function NotFound({code = 404, message = "Page not found"}: {code?: number, message?: string}) {
    return (
        <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
            <Typography variant={'h1'} textAlign='center' sx={{ fontWeight: 'bold', fontSize: '10em' }} color='info.main'>{code}</Typography>
            <Typography gutterBottom variant={'h5'} textAlign='center'>{message}</Typography>
            <Link component={RouterLink} to="/" underline="none">Back to home</Link>
        </Box>
    );
}