import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';

interface LoaderProps {
  message?: string;
  minHeight?: string;
}

const Loader: React.FC<LoaderProps> = ({ message, minHeight = '300px' }) => {
  const { t } = useTranslation();
  const text = message ?? t('LAYOUT.LOADING');

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight,
        gap: 2,
      }}
    >
      <CircularProgress sx={{ color: 'primary.main' }} size={44} />
      {text && (
        <Typography sx={{ color: 'text.secondary', fontSize: '14px', fontWeight: 500 }}>
          {text}
        </Typography>
      )}
    </Box>
  );
};

export default Loader;
