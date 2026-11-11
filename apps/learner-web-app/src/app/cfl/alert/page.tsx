'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Box, Typography, Card, CardContent, Avatar, Modal } from '@mui/material';
import CFLHeader from '../../../../../../libs/cfl/components/CFLHeader';
import AlertForm from '../../../../../../libs/cfl/components/AlertForm';
import { sendAlert, getDIForCFL } from '../../../../../../libs/cfl/services/cflService';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from '@shared-lib';

function AlertContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const trainerId = searchParams.get('trainerId') || '';
  const nameParam = searchParams.get('name');
  const targetRole = searchParams.get('targetRole');
  const avatarUrlParam = searchParams.get('avatarUrl');
  const isCflIncharge = targetRole === 'cfl_incharge';

  const [trainerName, setTrainerName] = useState('Jaya K.');
  const [trainerSub, setTrainerSub] = useState('CFL Jharkhand - Torpa');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const [submittedActionType, setSubmittedActionType] = useState('feedback');
  const [diName, setDiName] = useState('');
  const [diId, setDiId] = useState('');

  useEffect(() => {
    const fetchDI = async () => {
      const di = await getDIForCFL();
      if (di) {
        setDiName(di.name);
        setDiId(di.id);
      }
    };
    fetchDI();
  }, []);

  useEffect(() => {
    if (trainerId) {
      if (nameParam) setTrainerName(nameParam);
      setTrainerSub(`CFL Jharkhand - Torpa`);
    }
  }, [trainerId, nameParam]);

  const handleSubmit = async (data: any) => {
    setSubmittedActionType(data.actionType);

    // For "Raise to ARM", the notification goes to the DI's userId
    // For "feedback", it goes to the trainer's userId
    const targetUserId = data.actionType === 'raiseToDI' ? diId : trainerId;
    const cflName = typeof window !== 'undefined'
      ? (`${localStorage.getItem('firstName') || ''} ${localStorage.getItem('lastName') || ''}`.trim() || localStorage.getItem('name') || 'District Incharge')
      : 'District Incharge';

    const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : 'CFL';
    const stateName = typeof window !== 'undefined' ? localStorage.getItem('stateName') || 'Jharkhand' : 'Jharkhand';
    const districtName = typeof window !== 'undefined' ? localStorage.getItem('districtName') || 'Torpa' : 'Torpa';
    const isDI = userRole === 'ARM';
    const senderDesignation = isDI ? 'ARM' : 'District Incharge';
    const senderLocation = isDI ? `ARM: CFL ${stateName} - ${districtName}` : `District Incharge: CFL ${stateName} - ${districtName}`;

    const payload = {
      userId: targetUserId,
      title: data.actionType === 'raiseToDI' ? `Alert from ${senderDesignation} about ${trainerName}` : `Feedback from ${senderDesignation}`,
      message: data.message,
      metadata: {
        senderName: cflName,
        senderDesignation: senderDesignation,
        senderLocation: senderLocation,
        senderId: typeof window !== 'undefined' ? localStorage.getItem('userId') : ''
      }
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

  const handleCloseModal = (event?: any, reason?: string) => {
    if (reason === 'backdropClick') return;
    setModalOpen(false);
    if (modalType === 'success') {
      window.location.reload();
    }
  };

  return (
    <Box sx={{ pb: 10, bgcolor: '#fbfbfb', minHeight: '100vh' }}>
      <CFLHeader title={t('LEARNER_APP.ALERTS.NEW_ALERT')} showBack />

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
            <Typography sx={{ fontFamily: 'Open Sans', fontSize: '15px', fontWeight: 700, color: '#FFFFFF', mb: 0.5 }}>
              {trainerName}
            </Typography>
            <Typography sx={{ fontFamily: 'Inter', fontSize: '11px', fontWeight: 400, color: '#FFFFFF' }}>
              {trainerSub}
            </Typography>
          </Box>
          <Avatar src={avatarUrlParam || '/images/default.png'} sx={{ width: 48, height: 48 }} />
        </Box>

        <AlertForm isCflIncharge={isCflIncharge} onSubmit={handleSubmit} />
      </Box>

      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: 'blur(2px)',
              backgroundColor: 'rgba(0, 0, 0, 0.4)'
            }
          }
        }}
      >
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
            <Typography sx={{ justifyContent: "left", alignItems: "center", display: "flex", fontWeight: 800, mb: 2, color: '#1A1A1A', fontSize: 20, fontFamily: 'Open Sans' }}>
              {modalType === 'success' ? 'Alert sent' : 'Alert failed'}
            </Typography>
            <Typography sx={{ fontWeight: 400, color: '#333', fontSize: '12px', fontFamily: 'Open Sans' }}>
              {modalType === 'success' ? (
                submittedActionType === 'feedback' ? (
                  <>Feedback sent to <strong>{trainerName}</strong> successfully.</>
                ) : (
                  <>Raised alert about <strong>{trainerName}</strong> to ARM (<strong>{diName}</strong>) via notification successfully.</>
                )
              ) : (
                submittedActionType === 'feedback' ? (
                  <>Failed to send feedback to <strong>{trainerName}</strong>.</>
                ) : (
                  <>Failed to raise alert about <strong>{trainerName}</strong> to ARM.</>
                )
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
