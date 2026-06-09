'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Box, Typography, Card, CardContent, Avatar, Modal } from '@mui/material';
import CFLHeader from '../../../../../../libs/cfl/components/CFLHeader';
import AlertForm from '../../../../../../libs/cfl/components/AlertForm';
import { sendAlert } from '../../../../../../libs/cfl/services/cflService';
import { useSearchParams, useRouter } from 'next/navigation';

function AlertContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const trainerId = searchParams.get('trainerId') || '';
  const nameParam = searchParams.get('name');
  
  const [trainerName, setTrainerName] = useState('Jaya K.');
  const [trainerSub, setTrainerSub] = useState('CFL Jharkhand - Torpa');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (trainerId) {
      if (nameParam) setTrainerName(nameParam);
      setTrainerSub(`CFL Jharkhand - Torpa`);
    }
  }, [trainerId, nameParam]);

  const handleSubmit = async (data: any) => {
    const payload = {
      userId: trainerId,
      title: data.actionType === 'feedback' ? 'Feedback from CFL' : 'Action Required',
      message: data.message
    };
    
    const success = await sendAlert(payload as any);
    if (success) {
      setModalType('success');
      setModalOpen(true);
    } else {
      setModalType('error');
      setModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    if (modalType === 'success') {
      router.back();
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

      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: 400,
          bgcolor: 'background.paper',
          borderRadius: '12px',
          boxShadow: 24,
          overflow: 'hidden',
          outline: 'none'
        }}>
          <Box sx={{
            bgcolor: '#1C2B4A',
            py: 1.5,
            px: 2,
            display: 'flex',
            justifyContent: 'flex-end',
            color: '#fff',
            cursor: 'pointer'
          }} onClick={handleCloseModal}>
            <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>Close</Typography>
          </Box>
          <Box sx={{ p: 3, pb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: '#1C2B4A' }}>
              {modalType === 'success' ? 'Alert sent' : 'Alert failed'}
            </Typography>
            <Typography sx={{ color: '#333', fontSize: '16px' }}>
              {modalType === 'success' ? (
                <>Feedback sent to <strong>{trainerName}</strong> successfully.</>
              ) : (
                <>Failed to send feedback to <strong>{trainerName}</strong>.</>
              )}
            </Typography>
          </Box>
        </Box>
      </Modal>
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
