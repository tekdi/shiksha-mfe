import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, TextField, Typography } from '@mui/material';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import { useTranslation } from 'next-i18next';

const NAVY = '#1F1F4D';
const ORANGE = '#E6873C';
const MAX_LENGTH = 500;

interface SendNotificationDialogProps {
  open: boolean;
  /** Recipient's full name. */
  userName: string;
  /** Recipient's role, e.g. "CFL". */
  role?: string;
  /** Recipient's location, e.g. "Madhya Pradesh - Bhopal". */
  location?: string;
  onClose: () => void;
  /** Resolves when sent; throw to keep the dialog open and show the error. */
  onSend: (message: string) => Promise<void>;
}

const SendNotificationDialog: React.FC<SendNotificationDialogProps> = ({
  open,
  userName,
  role,
  location,
  onClose,
  onSend,
}) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setMessage('');
      setError('');
    }
  }, [open]);

  const handleSend = async () => {
    setSending(true);
    setError('');
    try {
      await onSend(message.trim());
    } catch (e: any) {
      setError(e?.message || t('USERS.DETAIL.NOTIFY_FAILED'));
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) onClose();
  };

  const subline = [role, location].filter(Boolean).join(': ');

  return (
    <Dialog
      open={open}
      onClose={(_e, reason) => {
        if (reason !== 'backdropClick') handleClose();
      }}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden', maxWidth: 500 } }}
    >
      {/* Navy top bar with Close */}
      <Box sx={{ bgcolor: NAVY, px: 3, py: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
        <Typography
          component="button"
          type="button"
          onClick={handleClose}
          sx={{
            background: 'none',
            border: 0,
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            p: 0,
          }}
        >
          {t('USERS.DETAIL.NOTIFY_CLOSE')}
        </Typography>
      </Box>

      <Box sx={{ p: 4, pt: 3 }}>
        <Typography sx={{ textAlign: 'center', fontSize: 22, fontWeight: 700, color: NAVY, mb: 3 }}>
          {t('USERS.DETAIL.NOTIFY_TITLE')}
        </Typography>

        {/* Recipient card */}
        <Box
          sx={{
            bgcolor: NAVY,
            color: '#FFFFFF',
            borderRadius: '12px',
            px: 2.5,
            py: 2,
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 16, wordBreak: 'break-word' }}>{userName}</Typography>
            {subline && <Typography sx={{ fontSize: 12, opacity: 0.85, mt: 0.25 }}>{subline}</Typography>}
          </Box>
          <AccountCircleOutlinedIcon sx={{ fontSize: 44, color: ORANGE, flexShrink: 0 }} />
        </Box>

        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#374151', mb: 1 }}>
          {t('USERS.DETAIL.NOTIFY_FIELD_MESSAGE')}
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
          placeholder={t('USERS.DETAIL.NOTIFY_PLACEHOLDER')}
          error={!!error}
          helperText={error || undefined}
          sx={{
            '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F9FAFB', fontSize: 14 },
          }}
        />
        <Typography sx={{ textAlign: 'right', fontSize: 12, color: '#9CA3AF', mt: 0.75 }}>
          {t('USERS.DETAIL.NOTIFY_CHAR_COUNT', { count: message.length, max: MAX_LENGTH })}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleClose}
            disabled={sending}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '10px',
              py: 1.25,
              color: ORANGE,
              borderColor: ORANGE,
              '&:hover': { borderColor: ORANGE, bgcolor: 'rgba(230,135,60,0.04)' },
            }}
          >
            {t('USERS.DETAIL.CANCEL')}
          </Button>
          <Button
            fullWidth
            variant="contained"
            disableElevation
            onClick={handleSend}
            disabled={!message.trim() || sending}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '10px',
              py: 1.25,
              bgcolor: ORANGE,
              '&:hover': { bgcolor: '#D07830' },
            }}
          >
            {sending ? t('USERS.DETAIL.NOTIFY_SENDING') : t('USERS.DETAIL.NOTIFY_SEND')}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default SendNotificationDialog;
