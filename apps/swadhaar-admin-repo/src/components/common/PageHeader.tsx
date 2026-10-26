import React from 'react';
import { Box, Typography } from '@mui/material';
import { NEUTRAL } from '@/styles/customTheme';

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Buttons rendered on the right side. */
  actions?: React.ReactNode;
}

/** Page title row used at the top of list and detail pages. */
const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      mb: 2.5,
      flexWrap: 'wrap',
      gap: 2,
    }}
  >
    <Box>
      <Typography component="h1" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '24px', mb: 0.5 }}>
        {title}
      </Typography>
      {subtitle && <Typography sx={{ color: NEUTRAL.muted, fontSize: '13px' }}>{subtitle}</Typography>}
    </Box>
    {actions && <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>{actions}</Box>}
  </Box>
);

export default PageHeader;
