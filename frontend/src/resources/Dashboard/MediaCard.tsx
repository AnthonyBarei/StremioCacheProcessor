import { useEffect, useState } from "react";
import axios from "axios";
import { socket } from '../../socket';

import { Box, Card, CardContent, CardMedia, IconButton, Tooltip, Typography } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';

import { FolderProcess, StremioStateFolderProcess } from "../../../../interfaces";

import StremioState from "../Stremio/StremioState";
import PlexModal from "../Plex/PlexModal";
import stremioLogo from '../../assets/stremio.png';
import qbittorrentLogo from '../../assets/qbittorrent.svg';
import plexLogo from '../../assets/plex.svg';
import StremioModal from "../Stremio/StremioModal";
import TorrentModal from "../Torrent/TorrentModal";
import TorrentState from "../Torrent/TorrentState";
import MoreInfoMenu from "./MoreInfoMenu";


const MediaCard = ({ metadata, removeItem }: { metadata: FolderProcess, removeItem: (id: string) => void}) => {  
  const title = metadata.stremio.stremioState.title || metadata.meta.name;
  // Stremio
  const [stremioModalOpen, setStremioModalOpen] = useState(false);
  const [stremioState, setStremioState] = useState<StremioStateFolderProcess>({
    name: '',
    downloaded: false,
    downloadSize: 0,
    downloadSpeed: 0,
    remainingTime: null,
    progress: 0,
    size: 0,
    downloading: false,
    title: title,
  });
  const [stremioWaiting, setStremioWaiting] = useState(false);
  const [stremioDownloaded, setStremioDownloaded] = useState(false);
  const [stremioCopied, setStremioCopied] = useState(false);
  // Torrent
  const [torrentModalOpen, setTorrentModalOpen] = useState(false);
  const [torrentAdded, setTorrentAdded] = useState(false);
  const [torrentWaiting, setTorrentWaiting] = useState(false);
  const [torrentProgress, setTorrentProgress] = useState(0);
  const [torrentDownloading, setTorrentDownloading] = useState(false);
  const [torrentDownloaded, setTorrentDownloaded] = useState(false);
  // Plex
  const [plexModalOpen, setPlexModalOpen] = useState(false);
  // Delete
  const [deleteError, setDeleteError] = useState(false);  
  
  const [selectedDownloadMethod, setSelectedDownloadMethod] = useState<string>('stremio');

  useEffect(() => {
    setStremioState(metadata.stremio.stremioState);
    setStremioWaiting(metadata.stremio.stremioState.downloading);
    setStremioDownloaded(metadata.stremio.stremioDownloaded);
    setStremioCopied(metadata.stremio.stremioCopied);
    
    setTorrentAdded(metadata.qbittorrent.qbittorrentAdded);
    setTorrentProgress(metadata.qbittorrent.qbittorrentProgress);
    setTorrentDownloading(metadata.qbittorrent.qbittorrentDownloading);
    setTorrentDownloaded(metadata.qbittorrent.qbittorrentDownloaded);

    if (metadata.qbittorrent.qbittorrentAdded || metadata.qbittorrent.qbittorrentDownloading || metadata.qbittorrent.qbittorrentDownloaded) {
      setSelectedDownloadMethod('torrent');
    } else {
      setSelectedDownloadMethod('stremio'); // default value
    }
  }, [metadata]);
  
  const handleStremio = () => {
    socket.emit('stremio-metacheck', { id: metadata.id, meta: metadata.meta });
    setStremioModalOpen(true);
    setSelectedDownloadMethod('stremio');
  };

  const handleTorrent = () => {    
    if (!torrentAdded) {
        socket.emit('torrent-add', { hash: metadata.id });
        setTorrentWaiting(true);
    } else {
      if (!torrentDownloading) {                
        socket.emit('torrent-debug', { hash: metadata.id });
        setTorrentWaiting(true);
      }
    }
    setTorrentModalOpen(true);
    setSelectedDownloadMethod('torrent');
  };

  const handlePlex = () => {
    setPlexModalOpen(true);
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

  const handleWatchTorrent = () => {
    axios.get(`http://localhost:3000/api/torrent/watch?hash=${metadata.id}`).then(() => {
      console.log('Video Started');
    }).catch((err) => {
      console.error(err);
    });
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

            {stremioCopied && (
              <Tooltip title="Watch" placement="top">
                <IconButton aria-label="Watch" sx={{ borderRadius: '10%' }} onClick={handleWatch}>
                  <PlayCircleIcon color="success"/>
                </IconButton>
              </Tooltip>
            )}

            {!stremioCopied && (
              <Tooltip title="Copy files from cache" placement="top">
                <IconButton aria-label="Copy files from cache" sx={{ borderRadius: '10%' }} onClick={handleStremio}>
                  {/* <ContentCopyIcon color={readyToCopy ? "info" : "disabled"}/> */}
                  {/* "disabled" | "action" | "inherit" | "primary" | "secondary" | "error" | "info" | "success" | "warning" */}
                  <img src={stremioLogo} alt="Stremio" style={{width: '20px', height: '20px'}}/>
                </IconButton>
              </Tooltip>
            )}

            {!torrentDownloaded && (
              <Tooltip title="Download Torrent" placement="top">
                <IconButton aria-label="Torrent Download" sx={{ borderRadius: '10%' }} onClick={handleTorrent}>
                  <img src={qbittorrentLogo} alt="qBittorrent" style={{width: '20px', height: '20px'}}/>
                </IconButton>
              </Tooltip>
            )}

            {torrentDownloaded && (
              <Tooltip title="watch" placement="top">
                <IconButton aria-label="Watch" sx={{ borderRadius: '10%' }} onClick={handleWatchTorrent}>
                  <PlayCircleIcon color="success"/>
                </IconButton>
              </Tooltip>
            )}

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
              <MoreInfoMenu/>
            </Tooltip>

            <Typography variant="body2" color="text.secondary" sx={{mt: 2, mb: 2}}>{metadata.meta.description}</Typography>

            {selectedDownloadMethod === 'stremio' && (
              <StremioState 
                metadata={metadata} 
                stremioState={stremioState} 
                waiting={stremioWaiting} 
                setWaiting={setStremioWaiting} 
                copied={stremioCopied} 
                downloaded={stremioDownloaded}
              />
            )}

            {selectedDownloadMethod === 'torrent' && (
              <TorrentState 
                hash={metadata.id} 
                progress={torrentProgress} 
                downloading={torrentDownloading}
                added={torrentAdded} 
                waiting={torrentWaiting} 
                setWaiting={setTorrentWaiting} 
                downloaded={torrentDownloaded} 
              />  
            )}

          </CardContent>
        </Box>
      </Card>

      <StremioModal 
        metadata={metadata} 
        open={stremioModalOpen} setOpen={setStremioModalOpen} 
        stremioState={stremioState} setStremioState={setStremioState}
        waiting={stremioWaiting} setWaiting={setStremioWaiting}
        copied={stremioCopied} setCopied={setStremioCopied} 
        downloaded={stremioDownloaded} setDownloaded={setStremioDownloaded}
      />
      <TorrentModal 
        hash={metadata.id} 
        open={torrentModalOpen} 
        setOpen={setTorrentModalOpen} 
        added={torrentAdded} 
        setAdded={setTorrentAdded}
        waiting={torrentWaiting}
        setWaiting={setTorrentWaiting}
        progress={torrentProgress}
        setProgress={setTorrentProgress}
        downloading={torrentDownloading}
        setDownloading={setTorrentDownloading}
        downloaded={torrentDownloaded}
        setDownloaded={setTorrentDownloaded}
      />
      <PlexModal hash={metadata.id} open={plexModalOpen} setOpen={setPlexModalOpen} />
    </Box>
  );
}

export default MediaCard;