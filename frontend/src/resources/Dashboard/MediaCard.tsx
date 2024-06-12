import { useEffect, useState } from "react";
import axios from "axios";
import { socket } from '../../socket';

import { Box, Card, CardContent, CardMedia, IconButton, Tooltip, Typography } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';

import { FolderProcess } from "../../../../interfaces";

import BasicModal from "../Torrent/TorrentModal";
import StremioState from "../Stremio/StremioState";
import PlexModal from "../Plex/PlexModal";
import stremioLogo from '../../assets/stremio.png';
import qbittorrentLogo from '../../assets/qbittorrent.svg';
import plexLogo from '../../assets/plex.svg';
import StremioModal from "../Stremio/StremioModal";


const MediaCard = ({ metadata, removeItem }: { metadata: FolderProcess, removeItem: (id: string) => void}) => {  
  const title = metadata.stremio.stremioState.title || metadata.meta.name;
  const [stremioModalOpen, setStremioModalOpen] = useState(false);
  const [qbittorrentModalOpen, setQbittorrentModalOpen] = useState(false);
  const [plexModalOpen, setPlexModalOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [copied, setCopied] = useState(metadata.stremio.stremioCopied);
  const [downloaded, setDownloaded] = useState(metadata.stremio.stremioDownloaded);

  useEffect(() => {
    socket.on('torrent-added', (response) => {
      if (response.hash === metadata.id) {
        setAdded(true);
        setQbittorrentModalOpen(true);
      }
    });

    return () => {
      socket.off('torrent-added');
    };
  }, [metadata, metadata.id]);

  const handleDownloadTorrent = () => {
    if (added) {
      setQbittorrentModalOpen(true);
      return;
    }
    
    socket.emit('torrent-add', { hash: metadata.id });
  };

  const handleState = () => {
    setQbittorrentModalOpen(true);
  };

  const handleMoreInfo = () => {
    console.log('More Info clicked');
  };

  const handleDelete = () => {
    axios.delete(`http://localhost:3000/api/folders/${metadata.id}`).then(() => {
      console.log('Folder deleted');
      removeItem(metadata.id);
    }).catch((err) => {
      console.error(err);
      setDeleteError(true);
    });
  };

  const handleWatch = () => {
    axios.get(`http://localhost:3000/api/watch?folder=${metadata.id}&title=${title}`).then(() => {
      console.log('Video Started');
    }).catch((err) => {
      console.error(err);
    });
  };

  const handlePlex = () => {
    socket.emit('get-plex-libraries', { hash: metadata.id });
    setPlexModalOpen(true);
  };

  const handleStremio = () => {
    socket.emit('stremio-metacheck', { id: metadata.id, meta: metadata.meta });
    setStremioModalOpen(true);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', }}>
      <Card sx={{ width: { xs: '100%', lg: '50%' }, height: 'auto', display: 'flex', flexDirection: 'row', mb: 4 }}>
        <CardMedia component="img" image={metadata.meta.poster} alt={title} sx={{ width: '250px' }}/>
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <CardContent>
            <Typography variant="h5" component="div">{title}</Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
              <Typography variant="body2" color="text.secondary" sx={{fontWeight: 'bold'}}>{metadata.meta.releaseInfo}</Typography>
              &nbsp;|&nbsp;
              <Typography variant="body2" color="text.secondary" sx={{fontWeight: 'bold'}}>{metadata.meta.runtime}</Typography>
              &nbsp;|&nbsp;
              <Typography variant="body2" color="text.secondary" sx={{fontWeight: 'bold'}}>IMDB: {metadata.meta.imdbRating}</Typography>
            </Box>

            {metadata.meta.director && metadata.meta.director.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                <Typography variant="body2" color="text.primary">Director:</Typography>&nbsp;
                <Typography variant="body2" color="text.secondary">{metadata.meta.director.join(', ')}</Typography>
              </Box>
            )}

            {metadata.meta.cast && metadata.meta.cast.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', mb: 2}}>
                <Typography variant="body2" color="text.primary">Cast:</Typography>&nbsp;
                <Typography variant="body2" color="text.secondary">{metadata.meta.cast.join(', ')}</Typography>
              </Box>
            )}

            {copied && (
              <Tooltip title="Watch" placement="top">
                <IconButton aria-label="Watch" sx={{ borderRadius: '10%' }} onClick={handleWatch}>
                  <PlayCircleIcon color="success"/>
                </IconButton>
              </Tooltip>
            )}

            {!copied && (
              <Tooltip title="Copy files from cache" placement="top">
                <IconButton aria-label="Copy files from cache" sx={{ borderRadius: '10%' }} onClick={handleStremio}>
                  {/* <ContentCopyIcon color={readyToCopy ? "info" : "disabled"}/> */}
                  {/* "disabled" | "action" | "inherit" | "primary" | "secondary" | "error" | "info" | "success" | "warning" */}
                  <img src={stremioLogo} alt="Stremio" style={{width: '20px', height: '20px'}}/>
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Download Torrent" placement="top">
              <IconButton aria-label="Torrent Download" sx={{ borderRadius: '10%' }} onClick={added ? handleState : handleDownloadTorrent}>
                <img src={qbittorrentLogo} alt="qBittorrent" style={{width: '20px', height: '20px'}}/>
              </IconButton>
            </Tooltip>

            <Tooltip title="Plex" placement="top">
              <IconButton aria-label="Plex" sx={{ borderRadius: '10%' }} onClick={handlePlex}>
                <img src={plexLogo} alt="Plex" style={{width: '20px', height: '20px'}}/>
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete files from cache" placement="top">
              <IconButton aria-label="Delete files from cache" sx={{ borderRadius: '10%' }} onClick={handleDelete}>
                <DeleteIcon color={!deleteError ? "action" : "error"}/>
              </IconButton>
            </Tooltip>

            <Tooltip title="More Info" placement="top">
              <IconButton aria-label="More Info" sx={{ borderRadius: '10%' }} onClick={handleMoreInfo}>
                <ExpandMoreIcon />
              </IconButton>
            </Tooltip>

            <Typography variant="body2" color="text.secondary" sx={{mt: 2, mb: 2}}>{metadata.meta.description}</Typography>

            <StremioState metadata={metadata} copied={copied} downloaded={downloaded}/>

          </CardContent>
        </Box>
      </Card>

      <StremioModal open={stremioModalOpen} setOpen={setStremioModalOpen} metadata={metadata} 
      copied={copied} setCopied={setCopied} downloaded={downloaded} setDownloaded={setDownloaded}/>
      <BasicModal open={qbittorrentModalOpen} setOpen={setQbittorrentModalOpen} hash={metadata.id}/>
      <PlexModal open={plexModalOpen} setOpen={setPlexModalOpen} hash={metadata.id}/>
    </Box>
  );
}

export default MediaCard;