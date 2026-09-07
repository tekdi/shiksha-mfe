'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Dialog, IconButton } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded';

interface ImageBlobProps {
  name: string;
  contentUrl: string;
  description?: string;
  onComplete: () => void;
}

export const ImageBlob: React.FC<ImageBlobProps> = ({ name, contentUrl, description, onComplete }) => {
  const [open, setOpen] = useState(false);

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
      <Box 
        sx={{ bgcolor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, p: 2, position: 'relative', cursor: 'pointer' }}
        onClick={() => setOpen(true)}
      >
        <Box
          component="img"
          src={contentUrl}
          alt={name}
          onError={(e: any) => { e.target.style.display = 'none'; }}
          sx={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: '8px' }}
        />
        <Box sx={{ position: 'absolute', bottom: 12, right: 12, bgcolor: 'rgba(0,0,0,0.6)', borderRadius: '50%', p: 0.5, display: 'flex' }}>
          <ZoomInRoundedIcon sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
      </Box>

      {/* Fullscreen Modal for Image Zoom */}
      <Dialog 
        fullScreen 
        open={open} 
        onClose={() => setOpen(false)}
        PaperProps={{ sx: { bgcolor: '#000' } }}
      >
        <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', bgcolor: 'rgba(0,0,0,0.5)', position: 'absolute', top: 0, width: '100%', zIndex: 10 }}>
            <IconButton onClick={() => setOpen(false)} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', p: 2 }}>
            <Box
              component="img"
              src={contentUrl}
              alt={name}
              sx={{ maxWidth: 'none', width: '100%', height: 'auto', objectFit: 'contain', transition: 'transform 0.3s ease' }}
            />
          </Box>
          {description && (
            <Box sx={{ p: 3, bgcolor: 'rgba(0,0,0,0.7)', position: 'absolute', bottom: 0, width: '100%' }}>
              <Typography sx={{ color: '#fff', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
                {description}
              </Typography>
            </Box>
          )}
        </Box>
      </Dialog>

      {/* Caption */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography sx={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
          {description || name}
        </Typography>
      </Box>
    </Box>
  );
};
