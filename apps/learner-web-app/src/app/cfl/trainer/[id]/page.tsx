'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import CFLHeader from '../../../../../../../libs/cfl/components/CFLHeader';
import ProfileCard from '../../../../../../../libs/cfl/components/ProfileCard';
import CourseAccordion from '../../../../../../../libs/cfl/components/CourseAccordion';
import FABButton from '../../../../../../../libs/cfl/components/FABButton';
import { useTrainerProgress } from '../../../../../../../libs/cfl/hooks/useCFL';
import { useParams } from 'next/navigation';

const PRIMARY = '#E6873C';

export default function TrainerDetailPage() {
  const { id } = useParams();
  const [tenantId, setTenantId] = useState('');
  const [trainerName, setTrainerName] = useState('Jaya K.');
  const [cflName, setCflName] = useState('CFL Jharkhand - Torpa');

  const { progress, loading } = useTrainerProgress(id as string, tenantId);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTenantId(localStorage.getItem('tenantId') || '');
      // In a real app, fetch trainer details by ID
      setTrainerName(`Jaya K.`);
      setCflName(`CFL ${localStorage.getItem('stateName') || 'Jharkhand'} - ${localStorage.getItem('districtName') || 'Torpa'}`);
    }
  }, [id]);

  return (
    <Box sx={{ pb: 10, bgcolor: '#fbfbfb', minHeight: '100vh' }}>
      <CFLHeader title="Trainer" showBack />
      
      <Box sx={{ p: 2 }}>
        <ProfileCard username={trainerName} location={cflName} />
        
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: '#1C2B4A', fontSize: '16px' }}>
          New Content Progress
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress sx={{ color: PRIMARY }} />
          </Box>
        ) : (
          <Box>
            {progress.length > 0 ? (
              progress.map((course) => (
                <Box key={course.id}>
                  <CourseAccordion levels={course.levels} />
                </Box>
              ))
            ) : (
              <Typography align="center" color="textSecondary" sx={{ py: 5 }}>
                No progress data found for this trainer.
              </Typography>
            )}
          </Box>
        )}
      </Box>

      <FABButton trainerId={id as string} />
    </Box>
  );
}
