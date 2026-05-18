'use client';

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const PRIMARY = '#E6873C';

interface CFLDesktopStatsCardProps {
  totalTrainers: number;
  completedTrainers: number;
}

const CFLDesktopStatsCard: React.FC<CFLDesktopStatsCardProps> = ({ totalTrainers, completedTrainers }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: '16px',
        border: '1px solid #E5E7EB',
        display: 'flex',
        gap: 4,
        mb: 4,
        bgcolor: '#fff',
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ color: '#6B7280', fontSize: 14, fontWeight: 600, mb: 1 }}>
          Total Trainers
        </Typography>
        <Typography sx={{ color: '#1C2B4A', fontSize: 32, fontWeight: 800 }}>
          {totalTrainers}
        </Typography>
      </Box>
      <Box sx={{ width: '1px', bgcolor: '#E5E7EB', my: 1 }} />
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ color: '#6B7280', fontSize: 14, fontWeight: 600, mb: 1 }}>
          Completed Trainers
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography sx={{ color: PRIMARY, fontSize: 32, fontWeight: 800 }}>
            {completedTrainers}
          </Typography>
          <Typography sx={{ color: '#9CA3AF', fontSize: 16, fontWeight: 600 }}>
            / {totalTrainers}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default CFLDesktopStatsCard;
