import React, { useState } from 'react';
import {
  TextField,
  IconButton,
  InputAdornment,
  Button,
  Typography,
  Box,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useTranslation } from '@shared-lib';
import { showToastMessage } from '../ToastComponent/Toastify';
import { useTenant } from '@learner/context/TenantContext';

interface ResetPasswordFormProps {
  onResetPassword: (
    oldPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => void;
  onForgotPassword: () => void;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  onResetPassword,
  onForgotPassword,
}) => {
  const { t } = useTranslation();
  const { contentFilter } = useTenant();
  const buttonTextColor = contentFilter?.buttonTextColor || contentFilter?.theme?.buttonTextColor || "#000000";
  const primaryColor = contentFilter?.theme?.primaryColor || "#FFC107";
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const toggleShowOldPassword = () => {
    setShowOldPassword((prev) => !prev);
  };

  const toggleShowNewPassword = () => {
    setShowNewPassword((prev) => !prev);
  };

  const validatePasswordRules = (password: string) => ({
    minLength: password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(password),
    number: /[0-9]/.test(password),
    specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  });

  const rules = validatePasswordRules(newPassword);
  const allValid = Object.values(rules).every(Boolean);
  const passwordsMatch = newPassword === confirmPassword;

  const handleSubmit = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToastMessage(
        t('LEARNER_APP.RESET_PASSWORD_FORM.FILL_ALL_FIELDS'),
        'error'
      );
      return;
    }

    if (!allValid) {
      showToastMessage(
        t('LEARNER_APP.RESET_PASSWORD_FORM.INVALID_PASSWORD'),
        'error'
      );
      return;
    }

    if (!passwordsMatch) {
      showToastMessage(
        t('LEARNER_APP.RESET_PASSWORD_FORM.PASSWORDS_MUST_MATCH'),
        'error'
      );
      return;
    }

    onResetPassword(oldPassword, newPassword, confirmPassword);
  };

  return (
    <Box
      sx={{
        maxWidth: 400,
        margin: '0 auto',
        p: 3,
        bgcolor: '#fff',
        borderRadius: 2,
        boxShadow: 3,
        textAlign: 'center',
      }}
    >
      <TextField
        label={t('LEARNER_APP.RESET_PASSWORD_FORM.OLD_PASSWORD')}
        type={showOldPassword ? 'text' : 'password'}
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
        fullWidth
        variant="outlined"
        sx={{ mb: 2 }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={toggleShowOldPassword} edge="end">
                {showOldPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <TextField
        label={t('LEARNER_APP.RESET_PASSWORD_FORM.NEW_PASSWORD')}
        type={showNewPassword ? 'text' : 'password'}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        fullWidth
        variant="outlined"
        sx={{ mb: 1 }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={toggleShowNewPassword} edge="end">
                {showNewPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {/* Show password checklist only when there are unmet requirements */}
      {newPassword && !allValid && (
        <Box sx={{ textAlign: 'left', mb: 2 }}>
          <Typography
            variant="caption"
            color={rules.minLength ? 'green' : 'error'}
          >
            • {t('LEARNER_APP.RESET_PASSWORD_FORM.PASSWORD_MIN_LENGTH')}
          </Typography>
          <br />
          <Typography
            variant="caption"
            color={rules.hasLetter ? 'green' : 'error'}
          >
            • {t('LEARNER_APP.RESET_PASSWORD_FORM.PASSWORD_LETTER')}
          </Typography>
          <br />
          <Typography
            variant="caption"
            color={rules.number ? 'green' : 'error'}
          >
            • {t('LEARNER_APP.RESET_PASSWORD_FORM.PASSWORD_NUMBER')}
          </Typography>
          <br />
          <Typography
            variant="caption"
            color={rules.specialChar ? 'green' : 'error'}
          >
            • {t('LEARNER_APP.RESET_PASSWORD_FORM.PASSWORD_SPECIAL')}
          </Typography>
        </Box>
      )}

      <TextField
        label={t('LEARNER_APP.RESET_PASSWORD_FORM.CONFIRM_NEW_PASSWORD')}
        type={showNewPassword ? 'text' : 'password'}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        fullWidth
        variant="outlined"
        sx={{ mb: 3 }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={toggleShowNewPassword} edge="end">
                {showNewPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Button
        variant="contained"
        fullWidth
        onClick={handleSubmit}
        disabled={!(allValid && confirmPassword)}
        sx={{
          backgroundColor: primaryColor,
          color: buttonTextColor,
          fontWeight: 'bold',
          '&:hover': {
            backgroundColor: primaryColor,
            opacity: 0.9,
          },
          mb: 2,
        }}
      >
        {t('LEARNER_APP.RESET_PASSWORD_FORM.RESET_PASSWORD')}
      </Button>

      <Typography
        variant="body2"
        color="secondary"
        sx={{ cursor: 'pointer', textDecoration: 'underline' }}
        onClick={onForgotPassword}
      >
        {t('LEARNER_APP.RESET_PASSWORD_FORM.FORGOT_PASSWORD')}
      </Typography>
    </Box>
  );
};

export default ResetPasswordForm;
