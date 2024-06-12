import * as React from 'react';
import { Link } from 'react-router-dom';

import axios from 'axios';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import GppGoodIcon from '@mui/icons-material/GppGood';
import GppBadIcon from '@mui/icons-material/GppBad';
import TvIcon from '@mui/icons-material/Tv';
import DownloadForOfflineIcon from '@mui/icons-material/DownloadForOffline';


const pages = {'Dashboard': '/', 'Configuration': '/configuration'};
const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];

function ResponsiveAppBar() {
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const [connectionSafe, setConnectionSafe] = React.useState<boolean>(false);
  const [stremioConnected, setStremioConnected] = React.useState<boolean>(false);
  const [qBittorrentConnected, setQBittorrentConnected] = React.useState<boolean>(false);

  React.useEffect(() => {
    getSafeConnection();
    isStremioConnected();
    isQBittorrentConnected();
  }, []);

  const getSafeConnection = () => {
    axios.get('http://localhost:3000/api/connection-safe').then((response) => {
      setConnectionSafe(response.data.safe);
    }).catch((error) => {
      console.error(error);
    });
  };

  const isStremioConnected = () => {
    axios.get('http://localhost:3000/api/stremio/connected').then((response) => {
      setStremioConnected(response.data.connected);
    }).catch((error) => {
      console.error(error);
    });
  };

  const isQBittorrentConnected = () => {
    axios.get('http://localhost:3000/api/torrent/connected').then((response) => {
      setQBittorrentConnected(response.data.connected);
    }).catch((error) => {
      console.error(error);
    });
  };

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <AppBar position="static">
      <Container maxWidth={false}>
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.1rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            StremioCacheProcessor
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {Object.entries(pages).map(([name, link]) => (
                <MenuItem key={name} onClick={handleCloseNavMenu} component={Link} to={link}>
                  <Typography textAlign="center">{name}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
          <Typography
            variant="h5"
            noWrap
            component="a"
            href="#app-bar-with-responsive-menu"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.2rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            SCP
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {Object.entries(pages).map(([name, link]) => (
              <Button
                key={name}
                onClick={handleCloseNavMenu}
                sx={{ my: 2, color: 'white', display: 'block' }}
                component={Link}
                to={link}
              >
                {name}
              </Button>
            ))}
          </Box>

          <Box sx={{ mr: 2 }}>
            <Tooltip title={connectionSafe ? 'connection is safe' : 'connection is not safe'} placement="top">
              <IconButton onClick={() => { window.location.href = "https://nordvpn.com/fr/pricing/" }} color={connectionSafe ? 'success' : 'error'} sx={{ p: 0, mr: 1 }}>
                {connectionSafe ? <GppGoodIcon/> : <GppBadIcon/>}
              </IconButton>
            </Tooltip>
            <Tooltip title={stremioConnected ? 'stremio is running' : 'stremio is not running'} placement="top">
              <IconButton color={stremioConnected ? 'success' : 'error'} sx={{ p: 0, mr: 1 }}>
                <TvIcon/>
              </IconButton>
            </Tooltip>
            <Tooltip title={qBittorrentConnected ? 'qbittorrent is running' : 'qbittorrent is not running'} placement="top">
              <IconButton color={qBittorrentConnected ? 'success' : 'error'} sx={{ p: 0 }}>
                <DownloadForOfflineIcon/>
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt="Remy Sharp" src="/static/images/avatar/2.jpg" />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting) => (
                <MenuItem key={setting} onClick={handleCloseUserMenu}>
                  <Typography textAlign="center">{setting}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default ResponsiveAppBar;
