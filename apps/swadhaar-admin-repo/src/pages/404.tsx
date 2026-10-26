import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <Box
      sx={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        p: 3,
      }}
    >
      <Typography variant="h1" sx={{ color: '#E6873C', fontWeight: 800, fontSize: '72px', mb: 1 }}>
        404
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#1C2B4A', mb: 1 }}>
        Page Not Found
      </Typography>
      <Typography variant="body2" sx={{ color: '#6B7280', maxWidth: 400, mb: 3 }}>
        The page you are looking for does not exist or has been moved within the Swadhaar Admin Portal.
      </Typography>
      <Link href="/users" style={{ textDecoration: 'none' }}>
        <Button
          variant="contained"
          sx={{
            backgroundColor: '#E6873C',
            '&:hover': { backgroundColor: '#C66C23' },
            fontWeight: 600,
          }}
        >
          Return to Home
        </Button>
      </Link>
    </Box>
  );
}
