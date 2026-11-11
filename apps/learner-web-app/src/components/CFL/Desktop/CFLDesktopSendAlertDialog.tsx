'use client';

import React, { useState } from 'react';
import {
  Box, Typography, Modal, Avatar, Button,
  MenuItem, Select, TextField, FormControl, CircularProgress, Snackbar, Alert
} from '@mui/material';
import { getDIForCFL } from '../../../../../../libs/cfl/services/cflService';
import { useTranslation } from '@shared-lib';

const PRIMARY = '#E6873C';
const DARK_NAV = '#1C2B4A';

interface Trainer {
  id: string;
  name: string;
  avatarUrl?: string;
  location?: string;
}

interface CFLDesktopSendAlertDialogProps {
  open: boolean;
  onClose: () => void;
  trainer: Trainer | null;
}

const CFLDesktopSendAlertDialog: React.FC<CFLDesktopSendAlertDialogProps> = ({ open, onClose, trainer }) => {
  const [actionType, setActionType] = useState('Feedback');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalType, setModalType] = useState<'form' | 'success' | 'error'>('form');
  const [diName, setDiName] = useState('');
  const [diId, setDiId] = useState('');
  const { t } = useTranslation();

  const [isDI, setIsDI] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole') || 'CFL';
      setIsDI(role === 'DI' || role === 'DISTRICT INCHARGE' || role === 'ARM');
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      const fetchDI = async () => {
        const di = await getDIForCFL();
        if (di) {
          setDiName(di.name);
          setDiId(di.id);
        }
      };
      fetchDI();

      if (typeof window !== 'undefined') {
        const role = localStorage.getItem('userRole') || 'CFL';
        if (role === 'DI' || role === 'DISTRICT INCHARGE' || role === 'ARM') {
          setActionType('Feedback');
        }
      }
    }
  }, [open]);

  if (!trainer) return null;

  const handleSendAlert = async () => {
    setLoading(true);
    try {
      // If Raise to ARM, send notification to the DI's userId; otherwise to the trainer's userId
      const targetUserId = actionType === 'Raise to ARM' ? diId : trainer.id;
      const cflName = typeof window !== 'undefined'
        ? (`${localStorage.getItem('firstName') || ''} ${localStorage.getItem('lastName') || ''}`.trim() || localStorage.getItem('name') || 'District Incharge')
        : 'District Incharge';

      const notifUrl = process.env.NEXT_PUBLIC_NOTIFICATION_URL
        ? `${process.env.NEXT_PUBLIC_NOTIFICATION_URL}/notification/inApp`
        : 'https://notification.tekdinext.com/notification/inApp';

      const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : 'CFL';
      const stateName = typeof window !== 'undefined' ? localStorage.getItem('stateName') || 'Jharkhand' : 'Jharkhand';
      const districtName = typeof window !== 'undefined' ? localStorage.getItem('districtName') || 'Torpa' : 'Torpa';
      const isDI = userRole === 'ARM';
      const senderDesignation = isDI ? 'ARM' : 'District Incharge';
      const senderLocation = isDI ? `ARM: CFL ${stateName} - ${districtName}` : `District Incharge: CFL ${stateName} - ${districtName}`;

      const response = await fetch(notifUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUserId,
          title: actionType === 'Raise to ARM' ? `Alert from ${senderDesignation} about ${trainer.name}` : `Feedback from ${senderDesignation}`,
          message: message,
          context: "USER_NOTIFICATION",
          metadata: {
            senderName: cflName,
            senderDesignation: senderDesignation,
            senderLocation: senderLocation,
            senderId: typeof window !== 'undefined' ? localStorage.getItem('userId') : ''
          }
        })
      });

      const data = await response.json();

      if (response.ok && (data.responseCode === 'OK' || data.params?.status === 'successful')) {
        setModalType('success');
        setLoading(false);
      } else {
        throw new Error(data.params?.errmsg || 'Failed to send alert');
      }

    } catch (error) {
      console.error(error);
      setModalType('error');
      setLoading(false);
    }
  };

  const handleCloseModal = (event?: any, reason?: string) => {
    if (reason === 'backdropClick') return;

    if (modalType === 'success' || modalType === 'error') {
      onClose();
      setTimeout(() => {
        setModalType('form');
        setMessage('');
        setActionType('Feedback');
      }, 300);
    } else {
      if (!loading) onClose();
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={handleCloseModal}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(3px)',
        }}
      >
        {modalType === 'form' ? (
          <Box
            sx={{
              bgcolor: '#fff',
              borderRadius: '16px',
              width: '90%',
              maxWidth: '500px',
              overflow: 'hidden',
              boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
            }}
          >
            {/* Header */}
            <Box sx={{ bgcolor: DARK_NAV, px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box /> {/* Spacer */}

              <Typography
                onClick={!loading ? onClose : undefined}
                sx={{
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: !loading ? 'pointer' : 'default',
                  opacity: loading ? 0.5 : 1,
                  '&:hover': !loading ? { opacity: 0.8 } : {}
                }}
              >
                {t("COMMON.CLOSE")}
              </Typography>
            </Box>

            <Box sx={{ p: 4 }}>
              {/* Trainer Info Box */}
              <Box sx={{ marginBottom: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography sx={{ fontFamily: 'Open Sans', color: '#1A1A1A', fontSize: 20, fontWeight: 700, textAlign: "center" }}>
                  {t("CFL_DASHBOARD.CREATE_ALERT")}
                </Typography>
              </Box>

              <Box
                sx={{
                  bgcolor: DARK_NAV,
                  borderRadius: '8px',
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 3
                }}
              >
                <Box>
                  <Typography sx={{ fontFamily: 'Open Sans', color: '#fff', fontWeight: 700, fontSize: 15 }}>
                    {trainer.name}
                  </Typography>
                  <Typography sx={{ color: '#FFFFFFBB', fontSize: 11, fontFamily: 'Inter' }}>
                    {trainer.location || 'CFL Jharkhand - Torpa'}
                  </Typography>
                </Box>
                <Avatar
                  src={trainer.avatarUrl || '/images/default.png'}
                  sx={{ width: 44, height: 44 }}
                />
              </Box>

              {/* Form */}
              <Typography sx={{ fontFamily: 'Open Sans', fontWeight: 600, fontSize: 13, color: '#1A1A1A', mb: 1 }}>
                {t("CFL_DASHBOARD.ACTION_TYPE")}
              </Typography>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <Select
                  size="small"
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  sx={{ borderRadius: '8px', bgcolor: '#F9FAFB', fontFamily: 'Open Sans', fontWeight: 400, fontSize: 14, color: '#1A1A1A' }}
                >
                  <MenuItem value="Feedback" sx={{ fontFamily: 'Open Sans', fontWeight: 400, fontSize: 14, color: '#1A1A1A' }}>
                    {isDI ? 'Share feedback to District Incharge' : 'Share feedback to trainer'}
                  </MenuItem>
                  {!isDI && (
                    <MenuItem value="Raise to ARM" sx={{ fontFamily: 'Open Sans', fontWeight: 400, fontSize: 14, color: '#1A1A1A' }}>Raise to ARM</MenuItem>
                  )}
                </Select>
              </FormControl>

              <Typography sx={{ fontFamily: "Open Sans", fontWeight: 600, fontSize: 13, color: '#1A1A1A', mb: 1 }}>
                {t("CFL_DASHBOARD.MESSAGE")}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={message}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    setMessage(e.target.value);
                  }
                }}
                inputProps={{ maxLength: 500 }}
                placeholder="Enter your message here..."
                error={message.length >= 500}
                InputProps={{
                  sx: { borderRadius: '10px', bgcolor: '#F9FAFB', fontSize: 10, fontFamily: 'Inter', fontWeight: 400, color: '#555555' }
                }}
                sx={{ mb: 0.5 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                <Typography sx={{ fontSize: 12, color: message.length >= 500 ? '#EF4444' : 'transparent', fontWeight: 500 }}>
                  {message.length >= 500 ? 'You reached the character limit.' : ' '}
                </Typography>
                <Typography sx={{ textAlign: 'right', fontSize: 12, color: message.length >= 500 ? '#EF4444' : '#9CA3AF' }}>
                  {message.length}/500 characters
                </Typography>
              </Box>

              {/* Actions */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={onClose}
                  disabled={loading}
                  sx={{
                    borderRadius: '8px',
                    borderColor: PRIMARY,
                    color: PRIMARY,
                    fontWeight: 600,
                    fontSize: 15,
                    fontFamily: 'Open Sans',
                    textTransform: 'none',
                    py: 1.25,
                    '&:hover': { borderColor: '#d67a32', bgcolor: 'transparent' }
                  }}
                >
                  {t("COMMON.CANCEL")}
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSendAlert}
                  disabled={loading || !message.trim()}
                  sx={{
                    borderRadius: '8px',
                    bgcolor: PRIMARY,
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 15,
                    fontFamily: 'Open Sans',
                    textTransform: 'none',
                    py: 1.25,
                    '&:hover': { bgcolor: '#d67a32' }
                  }}
                >
                  {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : t("CFL_DASHBOARD.SEND_ALERT")}
                </Button>
              </Box>
            </Box>
          </Box>
        ) : (
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
              <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>{t("COMMON.CLOSE")}</Typography>
            </Box>
            <Box sx={{ p: 3, pb: 4 }}>
              <Typography sx={{ justifyContent: "center", alignItems: "center", display: "flex", fontWeight: 700, mb: 2, color: '#1A1A1A', fontSize: 20, fontFamily: 'Open Sans' }}>
                {modalType === 'success' ? 'Alert sent' : 'Alert failed'}
              </Typography>
              <Typography sx={{ textAlign: "center", fontWeight: 400, color: '#333', fontSize: '12px', fontFamily: 'Open Sans' }}>
                {modalType === 'success' ? (
                  actionType === 'Raise to ARM' ? (
                    <>Raised alert about <strong>{trainer.name}</strong> to ARM (<strong>{diName}</strong>) via notification.</>
                  ) : (
                    <>Feedback sent to <strong>{trainer.name}</strong> successfully.</>
                  )
                ) : (
                  actionType === 'Raise to ARM' ? (
                    <>Failed to raise alert about <strong>{trainer.name}</strong> to ARM.</>
                  ) : (
                    <>Failed to send feedback to <strong>{trainer.name}</strong>.</>
                  )
                )}
              </Typography>
              <Button
                fullWidth
                onClick={handleCloseModal}
                sx={{
                  mt: 3,
                  border: '1px solid #E6873C',
                  borderRadius: '10px',
                  fontFamily: 'Open Sans',
                  fontWeight: 600,
                  fontSize: '15px',
                  color: '#E6873C',
                  textTransform: 'none',
                  py: 1
                }}
              >
                {t("COMMON.CLOSE")}
              </Button>
            </Box>
          </Box>
        )}
      </Modal>
    </>
  );
};

export default CFLDesktopSendAlertDialog;
