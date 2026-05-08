import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { useRouter } from 'next/navigation';

interface CFLHeaderProps {
  title: string;
  showBack?: boolean;
}

const CFLHeader: React.FC<CFLHeaderProps> = ({ title, showBack }) => {
  const router = useRouter();

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      p: 2, 
      bgcolor: '#fff',
      borderBottom: '1px solid #f0f0f0'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {showBack && (
          <IconButton onClick={() => router.back()} sx={{ mr: 1, p: 0 }}>
            <ArrowBackIcon sx={{ color: '#1C2B4A' }} />
          </IconButton>
        )}
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1C2B4A', fontSize: '18px' }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <NotificationsNoneIcon sx={{ color: '#E6873C', fontSize: '28px' }} />
        <Typography sx={{ 
          color: '#E6873C', 
          fontSize: '9px', 
          fontWeight: 700,
          mt: -0.5
        }}>
          Alerts
        </Typography>
      </Box>
    </Box>
  );
};

export default CFLHeader;
