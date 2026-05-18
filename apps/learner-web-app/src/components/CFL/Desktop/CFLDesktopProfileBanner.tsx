'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import ProfileAvatar from '@learner/components/Profile/ProfileAvatar';
import { useTranslation } from '@shared-lib';

const PRIMARY = '#E6873C';
const DARK_NAV = '#1C2B4A';

interface CFLDesktopProfileBannerProps {
  userName: string;
  location: string;
  totalTrainers: number;
  completedTrainers: number;
  profileImageUrl?: string | null;
  onProfileClick?: () => void;
}

const CFLDesktopProfileBanner: React.FC<CFLDesktopProfileBannerProps> = ({
  userName, location, totalTrainers, completedTrainers, profileImageUrl, onProfileClick,
}) => {
  const { t } = useTranslation();

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <Box
      id="cfl-desktop-profile-banner"
      sx={{
        bgcolor: DARK_NAV,
        borderRadius: '16px',
        p: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        mb: 4,
        boxShadow: '0 8px 32px rgba(28,43,74,0.15)',
      }}
    >
      {/* Avatar */}
      <Box
        onClick={onProfileClick}
        sx={{ cursor: 'pointer', flexShrink: 0, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.05)' } }}
      >
        <ProfileAvatar 
          initials={getInitials(userName)} 
          imageUrl={profileImageUrl} 
          size={64} 
          primaryColor={PRIMARY} 
        />
      </Box>

      {/* Name + Location */}
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 20, color: '#fff', lineHeight: 1.2 }}>
          {t('LEARNER_APP.HOME.GREETING', { name: userName })}
        </Typography>
        <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
          Designation: CFL Incharge - {location.startsWith('CFL') ? location : `Location: ${location}`}
        </Typography>
      </Box>

      {/* Stats Boxes */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* Total Trainers Box */}
        <Box 
          sx={{ 
            bgcolor: '#fff', 
            borderRadius: '12px', 
            p: 2, 
            minWidth: 100, 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            border: `1px solid ${PRIMARY}44`
          }}
        >
          <Typography sx={{ color: '#111', fontWeight: 800, fontSize: 24, lineHeight: 1 }}>
            {totalTrainers}
          </Typography>
          <Typography sx={{ color: '#6B7280', fontSize: 10, mt: 0.5, whiteSpace: 'nowrap' }}>
            Trainers
          </Typography>
        </Box>

        {/* Completed Trainers Box */}
        <Box 
          sx={{ 
            bgcolor: '#fff', 
            borderRadius: '12px', 
            p: 2, 
            minWidth: 120, 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            border: `1px solid ${PRIMARY}44`
          }}
        >
          <Typography sx={{ color: '#111', fontWeight: 800, fontSize: 24, lineHeight: 1 }}>
            {completedTrainers}/{totalTrainers}
          </Typography>
          <Typography sx={{ color: '#6B7280', fontSize: 10, mt: 0.5, lineHeight: 1.2 }}>
            Trainers completed<br/>new content
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default CFLDesktopProfileBanner;
