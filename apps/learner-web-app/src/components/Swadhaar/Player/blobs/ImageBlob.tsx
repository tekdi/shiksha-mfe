'use client';

import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';

interface ImageBlobProps {
  name: string;
  contentUrl: string;
  description?: string;
  onComplete: () => void;
}

export const ImageBlob: React.FC<ImageBlobProps> = ({ name, contentUrl, description, onComplete }) => {
  // Viewing an image = complete
  useEffect(() => {
    const t = setTimeout(() => onComplete(), 1500);
    return () => clearTimeout(t);
  }, []);

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
      {/* Header */}
      <Box sx={{ bgcolor: '#1C2B4A', px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Image
        </Typography>
        <Box sx={{ bgcolor: '#E6873C', borderRadius: '8px', px: 1, py: 0.25 }}>
          <Typography sx={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>Illustration</Typography>
        </Box>
      </Box>

      {/* Image */}
      <Box sx={{ bgcolor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, p: 2 }}>
        <Box
          component="img"
          src={contentUrl}
          alt={name}
          onError={(e: any) => { e.target.style.display = 'none'; }}
          sx={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: '8px' }}
        />
      </Box>

      {/* Caption */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography sx={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
          {description || name}
        </Typography>
      </Box>
    </Box>
  );
};
