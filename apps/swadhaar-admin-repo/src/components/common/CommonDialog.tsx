import React from 'react';
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'next-i18next';
import CommonButton, { CommonButtonVariant } from './CommonButton';
import { NEUTRAL } from '@/styles/customTheme';

export interface CommonDialogProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  /** Custom footer. When omitted, confirm/cancel buttons are rendered if `onConfirm` is set. */
  actions?: React.ReactNode;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: CommonButtonVariant;
  confirmDisabled?: boolean;
  loading?: boolean;
  showCloseIcon?: boolean;
  /** Prevents closing on backdrop click / escape (useful for forms). */
  disableBackdropClose?: boolean;
  maxWidth?: DialogProps['maxWidth'];
  paperMaxWidth?: string | number;
  dividers?: boolean;
}

/** Shared dialog shell: title, optional subtitle, content and a confirm/cancel footer. */
const CommonDialog: React.FC<CommonDialogProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  actions,
  onConfirm,
  confirmLabel,
  cancelLabel,
  confirmVariant = 'primary',
  confirmDisabled = false,
  loading = false,
  showCloseIcon = false,
  disableBackdropClose = false,
  maxWidth = 'sm',
  paperMaxWidth = '520px',
  dividers = false,
}) => {
  const { t } = useTranslation();

  const handleClose: DialogProps['onClose'] = (_event, reason) => {
    if (loading) return;
    if (disableBackdropClose && (reason === 'backdropClick' || reason === 'escapeKeyDown')) return;
    onClose();
  };

  const footer =
    actions ??
    (onConfirm ? (
      <>
        <CommonButton variant="outlined" onClick={onClose} disabled={loading}>
          {cancelLabel ?? t('COMMON.CANCEL')}
        </CommonButton>
        <CommonButton
          variant={confirmVariant}
          onClick={onConfirm}
          loading={loading}
          disabled={confirmDisabled}
        >
          {confirmLabel ?? t('COMMON.CONFIRM')}
        </CommonButton>
      </>
    ) : null);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: paperMaxWidth,
          borderRadius: '16px',
          backgroundColor: 'background.paper',
          boxShadow: '0 20px 48px rgba(31, 30, 28, 0.25)',
        },
      }}
    >
      <DialogTitle
        component="div"
        sx={{
          px: 3,
          pt: 3,
          pb: subtitle ? 1.5 : 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 2,
          ...(dividers && { borderBottom: `1px solid ${NEUTRAL.divider}` }),
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0 }}>
          <Typography component="h2" sx={{ fontSize: '18px', fontWeight: 700, color: 'text.primary' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ fontSize: '13px', color: NEUTRAL.muted }}>{subtitle}</Typography>
          )}
        </Box>
        {showCloseIcon && (
          <IconButton
            onClick={onClose}
            aria-label={t('COMMON.CLOSE')}
            disabled={loading}
            sx={{ width: 32, height: 32, color: NEUTRAL.ink, '&:hover': { backgroundColor: NEUTRAL.hover } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </DialogTitle>

      {children && (
        <DialogContent
          sx={{
            px: 3,
            py: dividers ? 2.5 : 1,
            color: NEUTRAL.muted,
            fontSize: '14px',
            lineHeight: 1.5,
          }}
        >
          {children}
        </DialogContent>
      )}

      {footer && (
        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            pt: 2,
            gap: 1.5,
            ...(dividers && { borderTop: `1px solid ${NEUTRAL.divider}` }),
          }}
        >
          {footer}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default CommonDialog;
