import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';

const LogoIcon = () => {
  const { t } = useTranslation();
  return (
    <Link href="/users" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
        }}
      >
        {/* Rounded square container with subtle dashed border */}
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: '8px',
            border: '1.5px dashed #D1D5DB',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 0.5,
            flexShrink: 0,
          }}
        >
          <Image
            src="/images/swadhar_logo.png"
            alt="Swadhaar FinAccess"
            width={28}
            height={28}
            style={{ objectFit: 'contain' }}
            priority
          />
        </Box>

        {/* Brand Title and Subtitle */}
        <Box sx={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              fontSize: '15px',
              color: 'text.primary',
              lineHeight: 1.2,
              letterSpacing: '-0.2px',
            }}
          >
            Swadhaar
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontSize: '11px',
              color: 'text.secondary',
              fontWeight: 500,
              lineHeight: 1.2,
            }}
          >
            {t('LAYOUT.ADMIN_PANEL_SUBTITLE')}
          </Typography>
        </Box>
      </Box>
    </Link>
  );
};

export default LogoIcon;

