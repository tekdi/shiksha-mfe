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
      <Box sx={{
        width: 24, height: 24,
        WebkitMaskImage: `url('/assets/images/material-symbols_home-rounded%20(1).png')`,
        WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center',
        backgroundColor: active ? '#E6873C' : '#9CA3AF'
      }} />
    ),
  },
  {
    labelKey: 'LEARNER_APP.LEARN.TITLE',
    fallbackLabel: 'Learn',
    path: '/learn',
    icon: (active: boolean) => (
      <Box sx={{
        width: 24, height: 24,
        WebkitMaskImage: `url('/assets/images/material-symbols_book-4-rounded%20(1).png')`,
        WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center',
        backgroundColor: active ? '#E6873C' : '#9CA3AF'
      }} />
    ),
  },
  {
    labelKey: 'CFL_DASHBOARD.PROFILE',
    fallbackLabel: 'Profile',
    path: '/swadhar-profile',
    icon: (active: boolean) => (
      <Box sx={{
        width: 24, height: 24,
        WebkitMaskImage: `url('/assets/images/material-symbols_account-circle%20(2).png')`,
        WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center',
        backgroundColor: active ? '#E6873C' : '#9CA3AF'
      }} />
    ),
  },
];

const SwadhaarBottomNav: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [homePath, setHomePath] = React.useState('/swadhaar-home');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      if (role === 'CFL' || role === 'cfl' || role === "DI") {
        setHomePath('/cfl/home');
      }
    }
  }, []);

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
        const itemPath = item.path === '/swadhaar-home' ? homePath : item.path;
        const isActive = pathname === itemPath || pathname?.startsWith(itemPath + '/');
        return (
          <Box
            key={item.path}
            onClick={() => router.push(itemPath)}
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
