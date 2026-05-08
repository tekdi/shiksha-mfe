'use client';

import React from 'react';
import { Box, Typography, Snackbar } from '@mui/material';
import { AlertCard } from '@learner/utils/alertsStore';
import {
  WatchLater as WatchLaterIcon,
  Description as DescriptionIcon,
  MenuBook as MenuBookIcon,
  Person as PersonIcon,
  EmojiEvents as EmojiEventsIcon,
  Info as InfoIcon,
  Group as GroupIcon,
} from '@mui/icons-material';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  quiz: <WatchLaterIcon fontSize="large" sx={{color:'#F8AC4F'}} />,
  content: <DescriptionIcon fontSize="small" />,
  lesson: <MenuBookIcon fontSize="small" />,
  feedback: <GroupIcon fontSize="large" sx={{ color: '#E6873C' }} />,
  badge: <EmojiEventsIcon fontSize="small" />,
  system: <InfoIcon fontSize="large" />,
};

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#9CA3AF">
    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
  </svg>
);

interface AlertsCarouselProps {
  alerts: AlertCard[];
  onAlertClick?: (alert: AlertCard) => void;
}

const AlertsCarousel: React.FC<AlertsCarouselProps> = ({ alerts, onAlertClick }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');

  const displayAlerts = alerts.slice(0, 5); // Max 5 in carousel

  if (!displayAlerts.length) {
    return (
      <Box
        sx={{
          bgcolor: '#F9FAFB',
          borderRadius: '10px',
          p: 2,
          textAlign: 'center',
        }}
      >
        <Typography sx={{ color: '#9CA3AF', fontSize: 14, fontFamily: 'Manrope', fontWeight: 500 }}>
          No new alerts
        </Typography>
      </Box>
    );
  }

  const currentAlert = displayAlerts[currentIndex];
  const isLocked = currentAlert?.locked;

  const handleClick = () => {
    if (isLocked) {
      setToastMessage(currentAlert.lockedMessage || 'Complete previous course to unlock.');
      setToastOpen(true);
      return;
    }
    onAlertClick?.(currentAlert);
  };

  return (
    <Box>
      {/* Carousel Card */}
      <Box
        onClick={handleClick}
        sx={{
          bgcolor: '#FFFFFF',
          border: `1px solid ${isLocked ? '#E5E7EB' : '#E6873C'}`,
          borderRadius: '10px',
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: isLocked ? 'not-allowed' : 'pointer',
          minHeight: 72,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          '&:hover': { bgcolor: isLocked ? '#FFFFFF' : '#FEF3E8' },
          transition: 'background 0.15s',
          opacity: isLocked ? 0.6 : 1,
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            // bgcolor: isLocked ? '#F3F4F6' : '#E6873C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
            position: 'relative',
          }}
        >
          {TYPE_ICONS[currentAlert.type] || 'ℹ️'}
          {isLocked && (
            <Box sx={{ position: 'absolute', bottom: -2, right: -2 }}>
              <LockIcon />
            </Box>
          )}
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: 14,
              color: isLocked ? '#9CA3AF' : '#1F2937',
              fontFamily: 'Manrope',
              lineHeight: 1.3,
            }}
          >
            {currentAlert.title}
          </Typography>
          <Typography
            sx={{
              fontSize: 11,
              color: '#6B7280',
              fontFamily: 'Manrope',
              fontWeight: 500,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {isLocked
              ? (currentAlert.lockedMessage || 'Complete previous course to unlock.')
              : currentAlert.message}
          </Typography>
        </Box>
        {isLocked ? (
          <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#9CA3AF">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
          </Box>
        ) : (
          <Typography sx={{ color: '#9CA3AF', flexShrink: 0 }}></Typography>
        )}
      </Box>

      {/* Pagination Dots */}
      {displayAlerts.length > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.75, mt: 1.5 }}>
          {displayAlerts.map((_, idx) => (
            <Box
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              sx={{
                width: idx === currentIndex ? 20 : 8,
                height: 8,
                borderRadius: '4px',
                bgcolor: idx === currentIndex ? '#E6873C' : '#D1D5DB',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </Box>
      )}

      {/* Toast for locked alerts */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        message={toastMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            bgcolor: '#1C2B4A',
            fontFamily: 'Inter, sans-serif',
            fontSize: 13,
            borderRadius: '12px',
          },
        }}
      />
    </Box>
  );
};

export default AlertsCarousel;
