import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';

interface ProfileCardProps {
  username: string;
  location: string;
  avatarUrl?: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ username, location, avatarUrl }) => {
  return (
    <Box sx={{ 
      bgcolor: '#1C2B4A', 
      borderRadius: '16px', 
      p: 2.5, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      mb: 2,
      color: '#fff',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <Box>
        <Typography sx={{ fontSize: '18px', fontWeight: 700, mb: 0.5 }}>
          Namaste, {username}
        </Typography>
        <Typography sx={{ fontSize: '10px', opacity: 0.8 }}>
          {location.startsWith('CFL') ? location : `CFL: ${location}`}
        </Typography>
      </Box>
      <Avatar 
        src={avatarUrl} 
        sx={{ 
          width: 48, 
          height: 48, 
          border: '2px solid rgba(255,255,255,0.2)',
          bgcolor: '#E6873C' 
        }} 
      />
    </Box>
  );
};

export default ProfileCard;
