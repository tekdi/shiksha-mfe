'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from '@shared-lib';

// Matching figma icons: Home (house), Learn (book/content), Profile (person)
const NAV_ITEMS = [
  {
    labelKey: 'LEARNER_APP.HOME.TITLE',
    fallbackLabel: 'Home',
    path: '/swadhaar-home',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#E6873C' : '#9CA3AF'}>
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    labelKey: 'LEARNER_APP.LEARN.TITLE',
    fallbackLabel: 'Learn',
    path: '/learn',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#E6873C' : '#9CA3AF'}>
        <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
      </svg>
    ),
  },
  {
    labelKey: 'LEARNER_APP.PROFILE.TITLE',
    fallbackLabel: 'Profile',
    path: '/swadhar-profile',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#E6873C' : '#9CA3AF'}>
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    ),
  },
];

const SwadhaarBottomNav: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        bgcolor: '#FFFFFF',
        borderTop: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 1000,
        boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
        return (
          <Box
            key={item.path}
            onClick={() => router.push(item.path)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.25,
              cursor: 'pointer',
              flex: 1,
              py: 0.5,
              '&:hover': { opacity: 0.75 },
            }}
          >
            {item.icon(isActive)}
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: isActive ? 700 : 400,
                color: isActive ? '#E6873C' : '#9CA3AF',
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1,
              }}
            >
              {t(item.labelKey, item.fallbackLabel)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default SwadhaarBottomNav;
