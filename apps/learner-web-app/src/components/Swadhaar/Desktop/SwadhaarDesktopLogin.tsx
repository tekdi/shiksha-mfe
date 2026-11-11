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
const OTP_LEN = 6;

interface SwadhaarDesktopLoginProps {
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

const MAX_RESEND = 3;

const SwadhaarDesktopLogin: React.FC<SwadhaarDesktopLoginProps> = ({
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
    /* Full-screen dark-navy background */
    <Box
      id="swadhaar-desktop-login-page"
      sx={{
        minHeight: '100dvh',
        bgcolor: DARK_NAV,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, #1C2B4A 0%, #243660 100%)`,
      }}
    >
      {/* White card */}
      <Box
        id="swadhaar-desktop-login-card"
        sx={{
          bgcolor: '#fff',
          borderRadius: '20px',
          p: '36px 40px',
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '16px',
              overflow: 'hidden',
              mb: 1.5,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            }}
          >
            <Image
              src="/images/swadhar_logo.png"
              alt={t('LEARNER_APP.HOME.LOGO_ALT')}
              width={72}
              height={72}
              style={{ objectFit: 'contain' }}
            />
          </Box>
          <Typography
            sx={{ fontFamily: 'Open Sans', fontWeight: 700, fontSize: 22, color: '#1A1A1A' }}
          >
            {t('LEARNER_APP.LOGIN.SIGN_IN')}
          </Typography>
          <Typography
            sx={{ fontFamily: 'Open Sans',fontWeight:400, fontSize: 13, color: '#6B7280', mt: 0.5 }}
          >
            {t('LEARNER_APP.LOGIN.SUBTITLE')}
          </Typography>
        </Box>

        {/* ── Language ── */}
        {/* <Typography
          sx={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: '#374151', mb: 0.75 }}
        >
          Language
        </Typography>
        <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
          <Select
            id="swadhaar-language-select"
            value={language || 'en'}
            onChange={handleLangChange}
            sx={{
              borderRadius: '8px',
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: PRIMARY },
            }}
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value} sx={{ fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl> */}

        {/* ── Mobile Number ── */}
        <Typography
          sx={{ fontFamily: 'Open Sans', fontSize: 13, fontWeight: 600, color: '#1A1A1A', mb: 0.75 }}
        >
          {t('LEARNER_APP.LOGIN.MOBILE_LABEL')}
        </Typography>
        <TextField
          id="swadhaar-mobile-input"
          fullWidth
          size="small"
          placeholder={t('LEARNER_APP.LOGIN.MOBILE_PLACEHOLDER')}
          value={mobile}
          onChange={(e) => onMobileChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
          inputProps={{ inputMode: 'numeric', maxLength: 10 }}
          sx={{
            mb: 2.5,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              fontSize: 14,
              fontFamily: 'Open Sans',
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: PRIMARY },
            },
          }}
        />

        {/* ── OTP ── */}
        <Typography
          sx={{ fontFamily: 'Open Sans', fontSize: 13, fontWeight: 600, color: '#1A1A1A', mb: 0.75 }}
        >
          {t('LEARNER_APP.LOGIN.OTP_LABEL')}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 2.75 }}>
          {otp.map((digit, idx) => (
            <TextField
              key={idx}
              id={`swadhaar-otp-${idx}`}
              value={digit}
              disabled={!otpSent}
              onChange={(e) => onOtpChange(idx, e.target.value)}
              onKeyDown={(e) => onOtpKeyDown(idx, e as React.KeyboardEvent<HTMLInputElement>)}
              inputProps={{
                maxLength: 1,
                inputMode: 'numeric',
                style: { textAlign: 'center', fontSize: 14, fontWeight: 400, fontFamily: 'Open Sans', padding: '10px 0' },
                onPaste: (e: any) => onOtpPaste(idx, e),
              }}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  fontFamily: 'Open Sans',
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

       

        {/* ── Sign In button ── */}
        <Button
          id="swadhaar-signin-btn"
          fullWidth
          onClick={onSignIn}
          disabled={!canSignIn}
          sx={{
            py: 2,
            bgcolor: canSignIn ? PRIMARY : '#E5E7EB',
            color: canSignIn ? '#fff' : '#9CA3AF',
            borderRadius: '10px',
            fontFamily: 'Open Sans',
            fontWeight: 600,
            fontSize: 15,
            textTransform: 'none',
            boxShadow: canSignIn ? `0 4px 16px rgba(230,135,60,0.35)` : 'none',
            transition: 'all 0.2s',
            '&:hover': { bgcolor: canSignIn ? '#D4782E' : '#E5E7EB' },
            '&:disabled': { color: '#9CA3AF', bgcolor: '#E5E7EB' },
          }}
        >
          {isSigningIn
            ? <CircularProgress size={20} sx={{ color: '#fff' }} />
            : t('LEARNER_APP.LOGIN.SIGN_IN')}
        </Button>
         {/* ── Send / Resend OTP ── */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 ,mt: 2.5}}>
          <Box
            id="swadhaar-send-otp-btn"
            component="span"
            onClick={canSendOtp ? onSendOtp : undefined}
            sx={{
              fontFamily: 'Open Sans',
              fontSize: 13,
              fontWeight: 600,
              color: canSendOtp ? '#E6873C' : '#9CA3AF',
              cursor: canSendOtp ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              userSelect: 'none',
              '&:hover': canSendOtp ? { textDecoration: 'underline' } : {},
            }}
          >
            {resendLabel()}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SwadhaarDesktopLogin;
