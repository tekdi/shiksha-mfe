'use client';

import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';

interface TextCardBlobProps {
  name: string;
  body?: string;          // HTML string
  subheading?: string;    // orange label below title
  description?: string;
  onComplete: () => void;
}

export const TextCardBlob: React.FC<TextCardBlobProps> = ({ name, body, subheading, description, onComplete }) => {
  useEffect(() => {
    const t = setTimeout(() => onComplete(), 1500);
    return () => clearTimeout(t);
  }, []);

  const htmlContent = body || description || '';

  return (
    <Box
      sx={{
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #E5E7EB',
        bgcolor: '#fff',
        mb: 2,
      }}
    >
      {/* Dark header */}
      <Box sx={{ bgcolor: '#1C2B4A', px: 2, py: 1 }}>
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Text Card
        </Typography>
      </Box>

      {/* Body */}
      <Box sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 16, color: '#1C2B4A', mb: subheading ? 0.5 : 1, fontFamily: 'Inter, sans-serif', lineHeight: 1.4 }}>
          {name}
        </Typography>
        {subheading && (
          <Typography sx={{ fontSize: 12, color: '#E6873C', fontWeight: 700, mb: 1.5, fontFamily: 'Inter, sans-serif' }}>
            {subheading}
          </Typography>
        )}
        {htmlContent ? (
          <Box
            sx={{
              fontSize: 14,
              color: '#374151',
              lineHeight: 1.7,
              fontFamily: 'Inter, sans-serif',
              '& p': { mb: 1 },
              '& ul': { pl: 2, mb: 1 },
              '& strong': { fontWeight: 700 },
            }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        ) : null}
      </Box>
    </Box>
  );
};
