import React, { useState } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import { useMediaQuery, Container, Box } from '@mui/material';
import Header from './header/Header';
import Sidebar from './sidebar/Sidebar';
import Footer from './footer/Footer';

const MainWrapper = styled('div')(({ theme }) => ({
  display: 'flex',
  height: '100vh',
  overflow: 'hidden',
  width: '100%',
  backgroundColor: theme.palette.background.default,
}));

const PageWrapper = styled('div')(({ theme }) => ({
  display: 'flex',
  flex: '1 1 auto',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: theme.palette.background.default,
  paddingTop: '64px',
  minWidth: 0,
  height: '100vh',
  boxSizing: 'border-box',
}));

export const FullLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const theme = useTheme();
  const lgUp = useMediaQuery(theme.breakpoints.up('lg'));

  return (
    <MainWrapper>
      <Header
        toggleMobileSidebar={() => setMobileSidebarOpen(true)}
      />
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onSidebarClose={() => setMobileSidebarOpen(false)}
      />
      <PageWrapper>
        {/* Only this area scrolls; header, side menu and footer stay in place */}
        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
          <Container
            maxWidth={false}
            sx={{
              paddingLeft: isSidebarOpen && lgUp ? '280px !important' : '20px !important',
              paddingRight: '20px !important',
              py: 3,
              backgroundColor: 'background.default',
            }}
          >
            {children}
          </Container>
        </Box>
        <Box sx={{ pl: isSidebarOpen && lgUp ? '260px' : 0, flexShrink: 0, backgroundColor: 'background.paper' }}>
          <Footer />
        </Box>
      </PageWrapper>
    </MainWrapper>
  );
};

export default FullLayout;
