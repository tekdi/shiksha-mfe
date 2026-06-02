'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import CFLHeader from '../../../../../../libs/cfl/components/CFLHeader';
import ProfileCard from '../../../../../../libs/cfl/components/ProfileCard';
import StatsCard from '../../../../../../libs/cfl/components/StatsCard';
import TrainerAccordion from '../../../../../../libs/cfl/components/TrainerAccordion';
import ContentProgressView from '../../../../../../libs/cfl/components/ContentProgressView';
import { useCFLTrainers } from '../../../../../../libs/cfl/hooks/useCFL';
import { useMediaQuery, useTheme } from '@mui/material';
import CFLDesktopHome from '../../../components/CFL/Desktop/CFLDesktopHome';
import { useRouter } from 'next/navigation';
import SwadhaarBottomNav from '../../../components/Swadhaar/SwadhaarBottomNav';

const PRIMARY = '#E6873C';

export default function CFLHomePage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'trainer' | 'content'>('trainer');
  const [tenantId, setTenantId] = useState('');
  const [username, setUsername] = useState('Priya!'); // Matched Figma "Priya!"
  const [location, setLocation] = useState('CFL Jharkhand - Torpa');

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const { trainers, loading, error } = useCFLTrainers(tenantId);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      const userId = localStorage.getItem('userId');
      if (role !== 'CFL' && userId !== '7f60190c-16eb-4583-bbef-c5fc7bc484e7') {
        router.push('/swadhaar-home');
        return;
      }
      setTenantId(localStorage.getItem('tenantId') || '');
      const firstName = localStorage.getItem('firstName');
      if (firstName) setUsername(firstName + '!');
      setLocation(`CFL: ${localStorage.getItem('stateName') || 'Jharkhand'} - ${localStorage.getItem('districtName') || 'Torpa'}`);
    }
  }, []);

  const completedCount = trainers.filter(t => t.progress >= 100).length;

  if (isDesktop) {
    return (
      <CFLDesktopHome
        trainers={trainers}
        loading={loading}
        error={error}
        username={username}
        location={location}
      />
    );
  }

  return (
    <Box sx={{ pb: 10, bgcolor: '#fbfbfb', minHeight: '100vh' }}>
      <CFLHeader title="CFL Incharge" />
      
      <Box sx={{ p: 2 }}>
        <ProfileCard username={username} location={location} />
        <StatsCard totalTrainers={loading ? 0 : trainers.length} completedTrainers={loading ? 0 : completedCount} />

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

      <SwadhaarBottomNav />
    </Box>
  );
}

