import React from 'react';
import { Box, Typography } from '@mui/material';

interface ProgressChipProps {
  status: 'completed' | 'in-progress' | 'locked';
  label: string;
}

const ProgressChip: React.FC<ProgressChipProps> = ({ status, label }) => {
  const getColors = () => {
    switch (status) {
      case 'completed':
        return { border: '#4CAF50', text: '#4CAF50', bg: 'rgba(76, 175, 80, 0.05)' };
      case 'in-progress':
        return { border: '#E6873C', text: '#E6873C', bg: 'rgba(230, 135, 60, 0.05)' };
      case 'locked':
      default:
        return { border: '#999999', text: '#999999', bg: 'rgba(153, 153, 153, 0.05)' };
    }
  };

  const colors = getColors();

  return (
    <Box sx={{ 
      border: `1px solid ${colors.border}`, 
      borderRadius: '20px', 
      px: 1.5, 
      py: 0.25,
      bgcolor: colors.bg,
      display: 'inline-block'
    }}>
      <Typography sx={{ color: colors.text, fontSize: '10px', fontWeight: 700 }}>
        {label}
      </Typography>
    </Box>
  );
};

export default ProgressChip;
