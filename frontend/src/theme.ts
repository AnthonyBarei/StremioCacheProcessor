import { createContext } from "react";
import { PaletteMode, ThemeOptions } from '@mui/material';

export const getDesignTokens = (mode: PaletteMode): ThemeOptions => ({
    palette: {
        mode,
        ...(mode === 'light' && {
            background: {
                default: '#f6f6f6',
            }
        }),
        ...(mode === 'dark' && {
            text: {
                // primary: grey[400],
            }
        }),
    },
});

export const ColorModeContext = createContext({ toggleColorMode: () => {} });
