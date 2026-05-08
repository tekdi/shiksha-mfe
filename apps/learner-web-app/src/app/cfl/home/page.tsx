'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import CFLHeader from '../../../../../../libs/cfl/components/CFLHeader';
import ProfileCard from '../../../../../../libs/cfl/components/ProfileCard';
import StatsCard from '../../../../../../libs/cfl/components/StatsCard';
import TrainerAccordion from '../../../../../../libs/cfl/components/TrainerAccordion';
import ContentProgressView from '../../../../../../libs/cfl/components/ContentProgressView';
import { useCFLTrainers } from '../../../../../../libs/cfl/hooks/useCFL';

const PRIMARY = '#E6873C';

export default function CFLHomePage() {
  const [viewMode, setViewMode] = useState<'trainer' | 'content'>('trainer');
  const [tenantId, setTenantId] = useState('');
  const [username, setUsername] = useState('Priya!'); // Matched Figma "Priya!"
  const [location, setLocation] = useState('CFL Jharkhand - Torpa');

  const { trainers, loading, error } = useCFLTrainers(tenantId);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTenantId(localStorage.getItem('tenantId') || '');
      setUsername(localStorage.getItem('firstName') + '!' || 'Priya!');
      setLocation(`CFL: ${localStorage.getItem('stateName') || 'Jharkhand'} - ${localStorage.getItem('districtName') || 'Torpa'}`);
    }
  }, []);

  const completedCount = trainers.filter(t => t.progress >= 100).length;

  return (
    <Box sx={{ pb: 10, bgcolor: '#fbfbfb', minHeight: '100vh' }}>
      <CFLHeader title="CFL Incharge" />
      
      <Box sx={{ p: 2 }}>
        <ProfileCard username={username} location={location} />
        <StatsCard totalTrainers={trainers.length || 4} completedTrainers={completedCount || 2} />

        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Button
            fullWidth
            variant={viewMode === 'trainer' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('trainer')}
            sx={{
              borderRadius: '20px',
              textTransform: 'none',
              bgcolor: viewMode === 'trainer' ? PRIMARY : 'transparent',
              borderColor: PRIMARY,
              color: viewMode === 'trainer' ? '#fff' : PRIMARY,
              fontWeight: 700,
              '&:hover': { bgcolor: viewMode === 'trainer' ? '#d67a32' : 'rgba(230,135,60,0.05)' }
            }}
          >
            Trainer Progress
          </Button>
          <Button
            fullWidth
            variant={viewMode === 'content' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('content')}
            sx={{
              borderRadius: '20px',
              textTransform: 'none',
              bgcolor: viewMode === 'content' ? PRIMARY : 'transparent',
              borderColor: PRIMARY,
              color: viewMode === 'content' ? '#fff' : PRIMARY,
              fontWeight: 700,
              '&:hover': { bgcolor: viewMode === 'content' ? '#d67a32' : 'rgba(230,135,60,0.05)' }
            }}
          >
            Content Progress
          </Button>
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: '#1C2B4A', fontSize: '16px' }}>
          {viewMode === 'trainer' ? 'Trainer List' : 'New Content Progress'}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress sx={{ color: PRIMARY }} />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">{error}</Typography>
        ) : (
          <Box>
            {viewMode === 'trainer' ? (
              trainers.map((trainer) => (
                <TrainerAccordion key={trainer.id} trainer={trainer} />
              ))
            ) : (
              <ContentProgressView trainers={trainers} />
            )}
          </Box>
        )}
      </Box>

      {/* Bottom Nav Mockup */}
      <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 64, bgcolor: '#fff', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 1000 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: PRIMARY }}>
           <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
           <Typography sx={{ fontSize: 10, fontWeight: 700 }}>Home</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#999', opacity: 0.5 }}>
           <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>
           <Typography sx={{ fontSize: 10 }}>Learn</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#999', opacity: 0.5 }}>
           <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
           <Typography sx={{ fontSize: 10 }}>Profile</Typography>
        </Box>
      </Box>
    </Box>
  );
}
