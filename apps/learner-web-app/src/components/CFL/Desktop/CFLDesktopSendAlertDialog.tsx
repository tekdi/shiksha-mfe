'use client';

import React, { useState } from 'react';
import { 
  Box, Typography, Modal, Avatar, Button, 
  MenuItem, Select, TextField, FormControl, CircularProgress, Snackbar, Alert 
} from '@mui/material';

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
  const [message, setMessage] = useState('Additional information is required to proceed.');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  });

  if (!trainer) return null;

  const handleSendAlert = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://notification.tekdinext.com/notification/inApp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: "7f60190c-16eb-4583-bbef-c5fc7bc484e7", // Hardcoded per requirements
          title: actionType,
          message: message,
          context: "USER_NOTIFICATION"
        })
      });

      const data = await response.json();

      if (response.ok && (data.responseCode === 'OK' || data.params?.status === 'successful')) {
        setToast({ open: true, message: 'Alert sent successfully!', severity: 'success' });
        setTimeout(() => {
          onClose();
          setLoading(false);
          // Reset form
          setMessage('Additional information is required to proceed.');
          setActionType('Feedback');
        }, 1500);
      } else {
        throw new Error(data.params?.errmsg || 'Failed to send alert');
      }
      
    } catch (error) {
      console.error(error);
      setToast({ open: true, message: 'Failed to send alert. Please try again.', severity: 'error' });
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={!loading ? onClose : undefined}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(3px)',
        }}
      >
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
            <Typography sx={{ color: '#fff', fontSize: 16, fontWeight: 700, ml: 4 }}>
              Create Alert
            </Typography>
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
              Close
            </Typography>
          </Box>

          <Box sx={{ p: 4 }}>
            {/* Trainer Info Box */}
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
                <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>
                  {trainer.name}
                </Typography>
                <Typography sx={{ color: '#9CA3AF', fontSize: 13 }}>
                  {trainer.location || 'CFL Jharkhand - Torpa'}
                </Typography>
              </Box>
              <Avatar 
                src={trainer.avatarUrl}
                sx={{ bgcolor: PRIMARY, width: 40, height: 40, border: `2px solid ${PRIMARY}` }}
              >
                {trainer.name.charAt(0)}
              </Avatar>
            </Box>

            {/* Form */}
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#374151', mb: 1 }}>
              Action Type
            </Typography>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <Select
                size="small"
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                sx={{ borderRadius: '8px', bgcolor: '#F9FAFB' }}
              >
                <MenuItem value="Feedback">Share feedback to trainer</MenuItem>
                <MenuItem value="Raise to DI">Raise to DI</MenuItem>
              </Select>
            </FormControl>

            <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#374151', mb: 1 }}>
              Message
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message here..."
              InputProps={{
                sx: { borderRadius: '8px', bgcolor: '#F9FAFB', fontSize: 14 }
              }}
              sx={{ mb: 1 }}
            />
            <Typography sx={{ textAlign: 'right', fontSize: 12, color: '#9CA3AF', mb: 4 }}>
              {message.length}/500 characters
            </Typography>

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
                  fontWeight: 700,
                  textTransform: 'none',
                  py: 1.25,
                  '&:hover': { borderColor: '#d67a32', bgcolor: 'transparent' }
                }}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSendAlert}
                disabled={loading}
                sx={{
                  borderRadius: '8px',
                  bgcolor: PRIMARY,
                  color: '#fff',
                  fontWeight: 700,
                  textTransform: 'none',
                  py: 1.25,
                  '&:hover': { bgcolor: '#d67a32' }
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Send Alert'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>

      <Snackbar 
        open={toast.open} 
        autoHideDuration={4000} 
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} sx={{ width: '100%', fontWeight: 600 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CFLDesktopSendAlertDialog;
