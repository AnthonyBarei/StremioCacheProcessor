import { useCallback, useEffect, useState } from 'react';
import axios from 'axios'; 

import { Box, Button, Typography } from '@mui/material';
import MainLayout from '../Layouts/Main';
import MovieCard from './MediaCard';

import { FolderProcess } from '../../../../interfaces';
import Loading from '../Layouts/Loading';
import { useSocket } from '../../providers/socketProvider';

const Dashboard = () => {
  const [data, setData] = useState<FolderProcess[]>([]);
  const { socket } = useSocket()

  const handleMeta = useCallback((response: FolderProcess) => {
    setData(prevData => {
        const exists = prevData.some(item => item.id === response.id);
        if (!exists) return [response, ...prevData];
        return prevData;
    });
  }, []);
  
  useEffect(() => {     
    socket.on('meta', handleMeta);

    return () => {
      socket.off('meta', handleMeta);
    };
  }, [handleMeta, socket]);

  useEffect(() => { fetchData(); }, [socket]);

  const fetchData = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/folders'); // replace with your backend endpoint
      console.log(response.data);
    } catch (error) {
      console.error('Error fetching data: ', error);
    }
  };  

  const removeItem = (id: string) => {
      setData(prevData => prevData.filter(item => item.id !== id));
  };

  console.log(data);
  
  return (
    <MainLayout>
      <Box sx={{ position: 'relative' }}>
        <Typography variant="h4" align="center" gutterBottom>Dashboard</Typography>
        <Button variant="contained" onClick={() => window.location.reload()} sx={{ position: 'absolute', right: 0, top: 0 }}>Refresh</Button>
      </Box>
      <Typography variant="body1" align="center" sx={{ mb: 2 }}>Manage your stremio movies and TV shows.</Typography>

      

      {!data || data.length < 1 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" align="center" gutterBottom sx={{ mb: 2 }}>Start a video on stremio to start browsing.</Typography>
          <Loading/>
        </Box>
      )}

      {data && data.length > 0 && data.map((item: FolderProcess, index: number) => 
        item.meta && (<MovieCard key={index} metadata={item} removeItem={removeItem}/>)
      )}
    </MainLayout>
  );
};

export default Dashboard;