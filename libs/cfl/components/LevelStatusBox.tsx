import React from 'react';
import { Box, Typography } from '@mui/material';

interface LevelStatusBoxProps {
  name: string;
  progressText: string;
  status: 'completed' | 'in-progress' | 'locked';
}

const LevelStatusBox: React.FC<LevelStatusBoxProps> = ({ name, progressText, status }) => {
  const getColors = () => {
    switch (status) {
      case 'completed':
        return { border: '#4CAF50', text: '#4CAF50' };
      case 'in-progress':
        return { border: '#E6873C', text: '#E6873C' };
      case 'locked':
      default:
        return { border: '#A3A3A3', text: '#A3A3A3' };
    }
  };

  const colors = getColors();

  return (
    <Box sx={{ 
      border: `1px solid ${colors.border}`, 
      borderRadius: '8px', 
      p: 1.5, 
      mb: 1.5,
      bgcolor: '#fff'
    }}>
      <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#1A1A1A',fontFamily:'Inter' }}>
        {name}
      </Typography>
      <Typography sx={{ fontSize: '10px', color: colors.text, fontFamily:'Inter' }}>
        {progressText}
      </Typography>
    </Box>
  );
};

export default LevelStatusBox;
