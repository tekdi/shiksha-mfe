'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Box, Typography, Card, CardContent, Avatar } from '@mui/material';
import CFLHeader from '../../../../../../libs/cfl/components/CFLHeader';
import AlertForm from '../../../../../../libs/cfl/components/AlertForm';
import { sendAlert } from '../../../../../../libs/cfl/services/cflService';
import { useSearchParams, useRouter } from 'next/navigation';

function AlertContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const trainerId = searchParams.get('trainerId') || '';
  
  const [trainerName, setTrainerName] = useState('Jaya K.');
  const [trainerSub, setTrainerSub] = useState('CFL Jharkhand - Torpa');

  useEffect(() => {
    if (trainerId) {
      // In a real app, fetch trainer name by ID
      setTrainerName(`Jaya K.`);
      setTrainerSub(`CFL Jharkhand - Torpa`);
    }
  }, [trainerId]);

  const handleSubmit = async (data: any) => {
    const success = await sendAlert({ ...data, trainerId });
    if (success) {
      alert('Feedback submitted successfully!');
      router.back();
    } else {
      alert('Failed to submit feedback.');
    }
  };

  return (
    <Box sx={{ pb: 10, bgcolor: '#fbfbfb', minHeight: '100vh' }}>
      <CFLHeader title="New Alert" showBack />
      
      <Box sx={{ p: 2 }}>
        <Box sx={{ 
          bgcolor: '#1C2B4A', 
          borderRadius: '16px', 
          p: 2.5, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 3,
          color: '#fff'
        }}>
          <Box>
            <Typography sx={{ fontSize: '18px', fontWeight: 700, mb: 0.5 }}>
              {trainerName}
            </Typography>
            <Typography sx={{ fontSize: '10px', opacity: 0.8 }}>
              {trainerSub}
            </Typography>
          </Box>
          <Avatar sx={{ width: 48, height: 48, bgcolor: '#E6873C' }}>{trainerName.charAt(0)}</Avatar>
        </Box>

        <AlertForm onSubmit={handleSubmit} />
      </Box>
    </Box>
  );
}

export default function AlertPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AlertContent />
    </Suspense>
  );
}
