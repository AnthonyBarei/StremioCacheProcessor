// React
import { useState, useMemo } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// MUI
import useMediaQuery from '@mui/material/useMediaQuery';
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { PaletteMode } from '@mui/material';
// Theme
import { getDesignTokens, ColorModeContext } from './theme';
// components
import Home from './resources/Dashboard/Dashboard';
import NotFound from './resources/Layouts/NotFound';
import Configuration from './resources/Configuration';
import PlexStoragePathCreate from './resources/Plex/PlexStoragePathCreate';
import PlexStoragePathEdit from './resources/Plex/PlexStoragePathEdit';

function App() {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)') ? 'dark' : 'light';
    const choosedDarkMode = localStorage.getItem('darkmode');
    const [mode, setMode] = useState(choosedDarkMode || prefersDarkMode);
    const theme = useMemo(() => createTheme(getDesignTokens(mode as PaletteMode)), [mode]);
    const colorMode = useMemo(() => ({ toggleColorMode: () => {
        setMode((prevMode) => {
            localStorage.setItem('darkmode', prevMode === 'light' ? 'dark' : 'light');
            return (prevMode === 'light' ? 'dark' : 'light')
        });
    }}), []);

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <Router>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/configuration" element={<Configuration/>} />
                        <Route path="/configuration/plex-storage-path" element={<PlexStoragePathCreate/>} />
                        <Route path="/configuration/plex-storage-path/:id" element={<PlexStoragePathEdit/>} />
                        {/* Add more routes as needed */}
                        <Route path="*" element={<NotFound/>} />
                    </Routes>
                </Router>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
}

export default App;