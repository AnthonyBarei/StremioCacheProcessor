import { ReactNode } from "react";

import {
    Container,
    Box,
    CssBaseline,
} from "@mui/material";
import ResponsiveAppBar from "./ResponsiveAppBar";
import Copyright from "./Copyright";



const MainLayout = ({children}: {children: ReactNode}) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <CssBaseline/>
            <ResponsiveAppBar/>

            <Container component="main" sx={{ flexGrow: 1, p: 3, }} maxWidth={false}>
                <Box sx={{ display: 'flex', width: '100%', flexDirection: 'column', }}>
                    {children}
                </Box>

                <Copyright/>
            </Container>
        </Box>
    )
}

export default MainLayout
