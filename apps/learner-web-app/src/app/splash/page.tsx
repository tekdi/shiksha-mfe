'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import { isTokenValid } from '@learner/utils/authUtils';
import { useTranslation } from '@shared-lib';
import { useMediaQuery, useTheme } from '@mui/material';

export default function SplashScreen() {
  const router = useRouter();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isTokenValid()) {
        const role = localStorage.getItem('userRole');
        // const userId = localStorage.getItem('userId');
        if (role === 'CFL' || role === 'cfl' || role === "DI") {
          router.push('/cfl/home');
        } else {
          router.push('/swadhaar-home');
        }
      } else {
        router.push('/swadhaar-login');
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  const { t } = useTranslation();
  const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
  const isCFL = role === 'CFL';

  return (
    <Box
      sx={{
        bgcolor: isCFL ? '#1C2B4A' : 'info.primary',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Logo Image */}
      <Box
        sx={{
          width: 120,
          height: 120,
          borderRadius: '20px',
          overflow: 'hidden',
          mb: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: isCFL ? '#E6873C' : 'transparent'
        }}
      >
        <Image
          src="/images/swadhar_logo.png"
          alt={t('LEARNER_APP.HOME.LOGO_ALT')}
          width={isCFL ? 80 : 120}
          height={isCFL ? 80 : 120}
          style={{ objectFit: 'contain' }}
        />
      </Box>

      {/* Title */}
      <Typography
        sx={{
          fontFamily: 'Open Sans',
          fontWeight: 700,
          fontSize: '26px',
          color: '#FFFFFF',
          textAlign: 'center',
          mb: 1,
          px: 3,
        }}
      >
        {isCFL ? 'CFL Incharge' : t('LEARNER_APP.SPLASH.TITLE')}
      </Typography>

      {/* Tagline */}
      <Typography
        sx={{
          fontFamily: 'Open Sans',
          fontWeight: 400,
          fontSize: '14px',
          color: '#FFFFFF8C',
          textAlign: 'center',
        }}
      >
        {isCFL ? 'Empowering Trainers, Transforming Learning' : t('LEARNER_APP.SPLASH.TAGLINE')}
      </Typography>


      {/* Footer */}
      <Typography
        sx={{
          position: 'absolute',
          bottom: 32,
          fontFamily: 'Open Sans',
          fontWeight: 400,
          fontSize: '11px',
          color: '#FFFFFF4D',
          textAlign: 'center',
          px: 2,
        }}
      >
        {t('LEARNER_APP.SPLASH.POWERED_BY')}
      </Typography>
    </Box>
  );
}
