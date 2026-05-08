'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';

interface ProgressCircleProps {
  percentage: number; // 0-100
  size?: number;      // diameter in px, default 40
  strokeWidth?: number;
}

/**
 * SVG-based circular progress indicator:
 * - 0%:     gray empty circle
 * - 1-99%:  orange arc with percentage label
 * - 100%:   solid green circle with ✓ checkmark
 */
const ProgressCircle: React.FC<ProgressCircleProps> = ({
  percentage,
  size = 40,
  strokeWidth = 3,
}) => {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  if (percentage >= 100) {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          bgcolor: '#28A745',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Typography sx={{ color: '#fff', fontSize: size * 0.4, lineHeight: 1, fontWeight: 700 }}>✓</Typography>
      </Box>
    );
  }

  if (percentage <= 0) {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: '3px solid #D1D5DB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          bgcolor: '#fff',
        }}
      >
        <Typography sx={{ color: '#9CA3AF', fontSize: size * 0.28, fontWeight: 600 }}>0%</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E6873C"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography sx={{ fontSize: size * 0.26, color: '#E6873C', fontWeight: 700 }}>
          {Math.round(percentage)}%
        </Typography>
      </Box>
    </Box>
  );
};

export default ProgressCircle;
