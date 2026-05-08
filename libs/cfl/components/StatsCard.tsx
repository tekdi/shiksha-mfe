import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

interface StatsCardProps {
  totalTrainers: number;
  completedTrainers: number;
}

const StatsCard: React.FC<StatsCardProps> = ({ totalTrainers, completedTrainers }) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
      <Card sx={{ flex: 1, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
        <CardContent sx={{ p: '16px !important', textAlign: 'center' }}>
          <Typography sx={{ fontSize: '18px', fontWeight: 800, color: '#1C2B4A' }}>
            {totalTrainers}
          </Typography>
          <Typography sx={{ fontSize: '9px', color: '#999', textTransform: 'uppercase' }}>
            Trainers
          </Typography>
        </CardContent>
      </Card>
      <Card sx={{ flex: 1.5, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
        <CardContent sx={{ p: '16px !important', textAlign: 'center' }}>
          <Typography sx={{ fontSize: '18px', fontWeight: 800, color: '#1C2B4A' }}>
            {completedTrainers}/{totalTrainers}
          </Typography>
          <Typography sx={{ fontSize: '9px', color: '#999', textTransform: 'uppercase' }}>
            Trainers completed new content
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default StatsCard;
