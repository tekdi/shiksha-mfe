import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import CommonDialog from './CommonDialog';
import CommonTextField from './CommonTextField';

interface SendNotificationDialogProps {
  open: boolean;
  userName: string;
  onClose: () => void;
  /** Resolves when sent; throw to keep the dialog open and show the error. */
  onSend: (title: string, message: string) => Promise<void>;
}

const SendNotificationDialog: React.FC<SendNotificationDialogProps> = ({ open, userName, onClose, onSend }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setTitle('');
      setMessage('');
      setError('');
    }
  }, [open]);

  const handleConfirm = async () => {
    setSending(true);
    setError('');
    try {
      await onSend(title.trim(), message.trim());
    } catch (e: any) {
      setError(e?.message || t('USERS.DETAIL.NOTIFY_FAILED'));
    } finally {
      setSending(false);
    }
  };

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={t('USERS.DETAIL.NOTIFY_TITLE')}
      subtitle={t('USERS.DETAIL.NOTIFY_SUBTITLE', { name: userName })}
      onConfirm={handleConfirm}
      confirmLabel={t('USERS.DETAIL.NOTIFY_SEND')}
      confirmDisabled={!title.trim() || !message.trim()}
      loading={sending}
      showCloseIcon
      disableBackdropClose
      maxWidth="sm"
    >
      <CommonTextField
        label={t('USERS.DETAIL.NOTIFY_FIELD_TITLE')}
        required
        fullWidth
        size="small"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        inputProps={{ maxLength: 100 }}
        sx={{ mb: 2 }}
      />
      <CommonTextField
        label={t('USERS.DETAIL.NOTIFY_FIELD_MESSAGE')}
        required
        fullWidth
        multiline
        minRows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        inputProps={{ maxLength: 500 }}
        error={!!error}
        helperText={error || undefined}
      />
    </CommonDialog>
  );
};

export default SendNotificationDialog;
