'use client';

import React from 'react';
import { Box, Typography, LinearProgress, Avatar } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { useTranslation } from '@shared-lib';

const PRIMARY = '#E6873C';
const SUCCESS = '#4CAF50';

interface CFLDesktopTrainerCardProps {
  trainer: {
    id: string;
    name: string;
    progress: number;
    avatarUrl?: string;
  };
  onClick?: () => void;
}

const CFLDesktopTrainerCard: React.FC<CFLDesktopTrainerCardProps> = ({ trainer, onClick }) => {
  const { t } = useTranslation();
  const isCompleted = trainer.progress >= 100;

  const borderColor = isCompleted ? SUCCESS : trainer.progress > 0 ? PRIMARY : '#E5E7EB';

  return (
    <Box
      onClick={onClick}
      sx={{
        bgcolor: '#fff',
        border: `1.5px solid ${borderColor}`,
        borderRadius: '12px',
        p: 2,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(230,135,60,0.15)',
          transform: 'translateY(-1px)',
        },
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar 
          src={trainer.avatarUrl || '/images/default.png'} 
          sx={{ width: 36, height: 36, bgcolor: '#fff', border: `2px solid ${PRIMARY}44` }}
        />
        <Box>
          <Typography
            sx={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: 14,
              color: '#1F2937',
              lineHeight: 1.2,
            }}
          >
            {trainer.name}
          </Typography>
          <Typography sx={{ fontSize: 10, color: '#9CA3AF' }}>
            ID: {trainer.id.slice(0, 8)}
          </Typography>
        </Box>
      </Box>

      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#6B7280' }}>
            Overall Progress
          </Typography>
          <Typography sx={{ fontSize: 10, fontWeight: 800, color: isCompleted ? SUCCESS : PRIMARY }}>
            {Math.round(trainer.progress)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={trainer.progress}
          sx={{
            height: 5,
            borderRadius: 3,
            bgcolor: '#F3F4F6',
            '& .MuiLinearProgress-bar': {
              bgcolor: isCompleted ? SUCCESS : PRIMARY,
              borderRadius: 3,
            },
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {isCompleted && <CheckCircleRoundedIcon sx={{ fontSize: 14, color: SUCCESS }} />}
        <Typography
          sx={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            fontWeight: 600,
            color: isCompleted ? SUCCESS : PRIMARY,
          }}
        >
          {isCompleted ? 'Completed' : 'In Progress'}
        </Typography>
      </Box>
    </Box>
  );
};

export default CFLDesktopTrainerCard;
