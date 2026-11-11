'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import ProgressCircle from '@learner/components/shared/ProgressCircle';

export interface ModuleData {
  id: string;
  name: string;
  completedSubtopics: number;
  totalSubtopics: number;
  completionPercentage: number;
  isUnlocked: boolean;
}

interface ModuleRowProps {
  module: ModuleData;
  levelId: string;
  onClick?: () => void;
}

const ModuleRow: React.FC<ModuleRowProps> = ({ module, levelId, onClick }) => {
  const isLocked = !module.isUnlocked;

  return (
    <Box
      onClick={() => {
        if (!isLocked) onClick?.();
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.5,
        bgcolor: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: '10px',
        mb: 1,
        opacity: isLocked ? 0.5 : 1,
        cursor: isLocked ? 'not-allowed' : 'pointer',
        '&:hover': { bgcolor: isLocked ? '#fff' : '#FEF3E8' },
        transition: 'background 0.15s',
      }}
    >
      {/* Progress circle */}
      <ProgressCircle percentage={module.completionPercentage} size={40} />

      {/* Module info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {isLocked && <Typography sx={{ fontSize: 16 }}>🔒</Typography>}
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: 14,
              color: '#1F2937',
              fontFamily: 'Inter, sans-serif',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            {module.name}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
          Completed {module.completedSubtopics}/{module.totalSubtopics} Subtopics
        </Typography>
      </Box>

      {/* Arrow */}
      {!isLocked && (
        <Typography sx={{ color: '#9CA3AF', fontSize: 18, flexShrink: 0 }}>→</Typography>
      )}
    </Box>
  );
};

export default ModuleRow;
