'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import { isTokenValid } from '@learner/utils/authUtils';
import { useTranslation } from '@shared-lib';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isTokenValid()) {
        const role = localStorage.getItem('userRole');
        const userId = localStorage.getItem('userId');
        if (role === 'CFL') {

        // if (role === 'CFL' || userId === '7f60190c-16eb-4583-bbef-c5fc7bc484e7') {
          router.push('/cfl/home');
        } else {
          router.push('/swadhaar-home');
        }
      } else {
        router.push('/language-selection');
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  const { t } = useTranslation();

  return (
    <Box
      sx={{
        bgcolor: 'info.primary',
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
        }}
      >
        <Image
          src="/images/swadhar_logo.png"
          alt={t('LEARNER_APP.HOME.LOGO_ALT')}
          width={120}
          height={120}
          style={{ objectFit: 'contain' }}
        />
      </Box>

      {/* Title */}
      <Typography
        variant="h4"
        sx={{
          color: 'common.white',
          fontWeight: 700,
          textAlign: 'center',
          mb: 1,
          px: 3,
        }}
      >
        {t('LEARNER_APP.SPLASH.TITLE')}
      </Typography>

      {/* Tagline */}
      <Typography
        variant="body2"
        sx={{
          color: 'rgba(255,255,255,0.6)',
          textAlign: 'center',
        }}
      >
        {t('LEARNER_APP.SPLASH.TAGLINE')}
      </Typography>

      {/* Footer */}
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          bottom: 32,
          color: 'rgba(255,255,255,0.4)',
          textAlign: 'center',
          px: 2,
        }}
      >
        {t('LEARNER_APP.SPLASH.POWERED_BY')}
      </Typography>
    </Box>
  );
}
