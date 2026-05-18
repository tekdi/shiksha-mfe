'use client';

import React from 'react';
import {
  Box, Typography, TextField, Button, CircularProgress, Select,
  MenuItem, FormControl, InputLabel, SelectChangeEvent,
} from '@mui/material';
import Image from 'next/image';
import { useTranslation } from '@shared-lib';
import { LANGUAGE_OPTIONS } from '@learner/utils/constants/language';

const PRIMARY = '#E6873C';
const DARK_NAV = '#1C2B4A';

interface CFLDesktopLoginProps {
  /* state */
  mobile: string;
  otp: string[];
  otpSent: boolean;
  isSendingOtp: boolean;
  isSigningIn: boolean;
  resendTimer: number;
  resendAttempts: number;
  canSendOtp: boolean;
  canSignIn: boolean;
  /* handlers */
  onMobileChange: (value: string) => void;
  onOtpChange: (index: number, value: string) => void;
  onOtpKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onOtpPaste: (index: number, e: React.ClipboardEvent<HTMLInputElement>) => void;
  onSendOtp: () => void;
  onSignIn: () => void;
}

const CFLDesktopLogin: React.FC<CFLDesktopLoginProps> = ({
  mobile, otp, otpSent, isSendingOtp, isSigningIn,
  resendTimer, resendAttempts, canSendOtp, canSignIn,
  onMobileChange, onOtpChange, onOtpKeyDown, onOtpPaste, onSendOtp, onSignIn,
}) => {
  const { t, language, setLanguage } = useTranslation();

  const handleLangChange = (e: SelectChangeEvent<string>) => {
    setLanguage(e.target.value);
    if (typeof window !== 'undefined') localStorage.setItem('lang', e.target.value);
  };

  const resendLabel = () => {
    if (isSendingOtp) return <CircularProgress size={14} sx={{ color: PRIMARY }} />;
    if (resendTimer > 0) {
      return t('LEARNER_APP.LOGIN.RESEND_IN', {
        seconds: `${Math.floor(resendTimer / 60)}:${String(resendTimer % 60).padStart(2, '0')}`,
      });
    }
    return t('LEARNER_APP.LOGIN.SEND_RESEND_OTP');
  };

  return (
    <Box
      id="cfl-desktop-login-page"
      sx={{
        minHeight: '100dvh',
        bgcolor: DARK_NAV,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, #1C2B4A 0%, #243660 100%)`,
      }}
    >
      <Box
        id="cfl-desktop-login-card"
        sx={{
          bgcolor: '#fff',
          borderRadius: '20px',
          p: '40px',
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '16px',
              overflow: 'hidden',
              mb: 2,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              bgcolor: PRIMARY,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Image
              src="/images/swadhar_logo.png"
              alt="CFL Logo"
              width={56}
              height={56}
              style={{ objectFit: 'contain' }}
            />
          </Box>
          <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 24, color: '#1C2B4A' }}>
            CFL Incharge Login
          </Typography>
          <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280', mt: 1 }}>
            Access your dashboard and manage trainers
          </Typography>
        </Box>

        {/* Language Selection */}
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#374151', mb: 1 }}>
          Choose Language
        </Typography>
        <FormControl fullWidth size="small" sx={{ mb: 3 }}>
          <Select
            value={language || 'en'}
            onChange={handleLangChange}
            sx={{
              borderRadius: '10px',
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: PRIMARY },
            }}
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Mobile Input */}
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#374151', mb: 1 }}>
          Mobile Number
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Enter 10 digit mobile number"
          value={mobile}
          onChange={(e) => onMobileChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
          inputProps={{ inputMode: 'numeric', maxLength: 10 }}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: PRIMARY },
            },
          }}
        />

        {/* OTP Inputs */}
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#374151', mb: 1 }}>
          One Time Password
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, mb: 1.5 }}>
          {otp.map((digit, idx) => (
            <TextField
              key={idx}
              value={digit}
              disabled={!otpSent}
              onChange={(e) => onOtpChange(idx, e.target.value)}
              onKeyDown={(e) => onOtpKeyDown(idx, e as React.KeyboardEvent<HTMLInputElement>)}
              inputProps={{
                maxLength: 1,
                inputMode: 'numeric',
                style: { textAlign: 'center', fontSize: 22, fontWeight: 800, padding: '12px 0' },
              }}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: PRIMARY },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: digit ? PRIMARY : '#D1D5DB',
                    borderWidth: digit ? 2 : 1,
                  },
                },
              }}
            />
          ))}
        </Box>

        {/* Sign In Button */}
        <Button
          fullWidth
          onClick={onSignIn}
          disabled={!canSignIn}
          sx={{
            py: 1.75,
            mt: 3,
            bgcolor: canSignIn ? PRIMARY : '#E5E7EB',
            color: '#fff',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: 16,
            textTransform: 'none',
            boxShadow: canSignIn ? `0 8px 20px rgba(230,135,60,0.3)` : 'none',
            '&:hover': { bgcolor: canSignIn ? '#D4782E' : '#E5E7EB' },
          }}
        >
          {isSigningIn ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Sign In'}
        </Button>

        {/* Send/Resend OTP */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Box
            onClick={canSendOtp ? onSendOtp : undefined}
            sx={{
              fontSize: 15,
              fontWeight: 700,
              color: canSendOtp ? DARK_NAV : '#9CA3AF',
              cursor: canSendOtp ? 'pointer' : 'default',
              '&:hover': canSendOtp ? { color: PRIMARY } : {},
            }}
          >
            {resendLabel()}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CFLDesktopLogin;
