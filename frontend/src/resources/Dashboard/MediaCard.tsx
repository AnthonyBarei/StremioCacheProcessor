import { useEffect, useState } from "react";
import axios from "axios";
import { socket } from '../../socket';

import { Box, Card, CardContent, CardMedia, IconButton, Tooltip, Typography } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';

import { FolderProcess, Meta, StremioStateFolderProcess } from "../../../../interfaces";

import StremioState from "../Stremio/StremioState";
import PlexModal from "../Plex/PlexModal";
import stremioLogo from '../../assets/stremio.png';
import qbittorrentLogo from '../../assets/qbittorrent.svg';
import plexLogo from '../../assets/plex.svg';
import StremioModal from "../Stremio/StremioModal";
import TorrentModal from "../Torrent/TorrentModal";
import TorrentState from "../Torrent/TorrentState";
import MoreInfoMenu from "./MoreInfoMenu";
import MetadataModal from "./MetadataModal";
import AssociationModal from "./AssociationModal";
import DefineAsModal from "./DefineAsModal";


const MediaCard = ({ metadata, removeItem }: { metadata: FolderProcess, removeItem: (id: string) => void}) => {  
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
    title: '',
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
  // Metadata
  const [title, setTitle] = useState('' as string);
  const [meta, setMeta] = useState({} as Meta);
  const [metaModalOpen, setMetaModalOpen] = useState(false);
  // Association
  const [associationModalOpen, setAssociationModalOpen] = useState(false);
  // DegineAs
  const [defineAsModalOpen, setDefineAsModalOpen] = useState(false);
  // Delete
  const [deleteError, setDeleteError] = useState(false);  
  
  const [selectedDownloadMethod, setSelectedDownloadMethod] = useState<string>('stremio');

  useEffect(() => {
    const type = metadata.selectedMetadata?.type || metadata.meta.type;
    const defaultTitle = metadata.selectedMetadata?.name || metadata.meta.name;
    
    if (type === 'series' || type === 'other') {
      const season = metadata.selectedMetadata?.season || metadata.meta.videos[0]?.season;
      const episode = metadata.selectedMetadata?.episode || metadata.meta.videos[0]?.episode;
      const serieTitle = season && episode ? `${defaultTitle} - S${season}E${episode}` : defaultTitle;
      setTitle(serieTitle);
    } else {
      setTitle(defaultTitle);
    }

    setMeta(metadata.selectedMetadata || metadata.meta);

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
  
  const handleStremioWatch = () => {
    axios.get(`http://localhost:3000/api/stremio/watch?folder=${metadata.id}&title=${title}`).then(() => {
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
        <CardMedia component="img" image={meta.poster} alt={title} sx={{ width: '250px' }}/>
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <CardContent>
            <Typography variant="h5" component="div">{title}</Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
              <Typography variant="body2" color="text.secondary" sx={{fontWeight: 'bold'}}>{meta.releaseInfo}</Typography>
              &nbsp;|&nbsp;
              <Typography variant="body2" color="text.secondary" sx={{fontWeight: 'bold'}}>{meta.runtime}</Typography>
              &nbsp;|&nbsp;
              <Typography variant="body2" color="text.secondary" sx={{fontWeight: 'bold'}}>IMDB: {meta.imdbRating}</Typography>
            </Box>

            {meta.director && meta.director.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                <Typography variant="body2" color="text.primary">Director:</Typography>&nbsp;
                <Typography variant="body2" color="text.secondary">{meta.director.join(', ')}</Typography>
              </Box>
            )}

            {meta.cast && meta.cast.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                <Typography variant="body2" color="text.primary">Cast:</Typography>&nbsp;
                <Typography variant="body2" color="text.secondary">{meta.cast.join(', ')}</Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', mb: 2}}>
                <Typography variant="body2" color="text.primary">Type:</Typography>&nbsp;
                <Typography variant="body2" color="text.secondary">{meta.type}</Typography>
            </Box>

            {stremioCopied && (
              <Tooltip title="Watch" placement="top">
                <IconButton aria-label="Watch" sx={{ borderRadius: '10%' }} onClick={handleStremioWatch}>
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

            <MoreInfoMenu openMetadata={setMetaModalOpen} openAssociation={setAssociationModalOpen} openDefineAs={setDefineAsModalOpen}/>

            <Typography variant="body2" color="text.secondary" sx={{mt: 2, mb: 2}}>{meta.description}</Typography>

            {selectedDownloadMethod === 'stremio' && (
              <StremioState 
                metadata={metadata} 
                stremioState={stremioState} 
                waiting={stremioWaiting} 
                setWaiting={setStremioWaiting} 
                copied={stremioCopied} 
                downloaded={stremioDownloaded}
                openDefineAs={setDefineAsModalOpen}
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
        openDefineAs={setDefineAsModalOpen}
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
      <MetadataModal open={metaModalOpen} setOpen={setMetaModalOpen} metadata={metadata} />
      <AssociationModal open={associationModalOpen} setOpen={setAssociationModalOpen} metadata={metadata} setMeta={setMeta} setTitle={setTitle}/>
      <DefineAsModal open={defineAsModalOpen} setOpen={setDefineAsModalOpen} type={meta.type} id={metadata.id}/>
    </Box>
  );
}

export default MediaCard;