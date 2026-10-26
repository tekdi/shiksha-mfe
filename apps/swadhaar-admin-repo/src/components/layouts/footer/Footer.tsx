import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';

const Footer = () => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        py: 2.5,
        textAlign: 'center',
        borderTop: '1px solid',
        borderColor: 'divider',
        mt: 'auto',
      }}
    >
      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>
        {t('LAYOUT.FOOTER_COPYRIGHT', { year: new Date().getFullYear() })}
      </Typography>
    </Box>
  );
};

export default Footer;
