'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Typography, TextField, Button, CircularProgress } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { checkUserExistenceWithTenant } from '@learner/utils/API/userService';
import { sendOTP, verifyOTP } from '@learner/utils/API/OtPService';
import { getUserId } from '@learner/utils/API/LoginService';
import { showToastMessage } from '@learner/components/ToastComponent/Toastify';
import { profileComplitionCheck, getUserDetails } from '@learner/utils/API/userService';
import { ensureAcademicYearForTenant } from '@learner/utils/API/ProgramService';
import { useTenant } from '@learner/context/TenantContext';
import { useTranslation } from '@shared-lib';

const SWADHAAR_TENANT_ID = '35529b5d-526f-4da5-bc6e-64f740023d26';
const PRIMARY = '#E6873C';
const DARK_NAV = '#1C2B4A';
const TIMER_SECS = 120;
const MAX_RESEND = 3;
const OTP_LEN = 6;

export default function SwadhaarLoginPage() {
  const router = useRouter();
  const { tenant } = useTenant();
  const { t } = useTranslation();

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LEN).fill(''));
  const [otpHash, setOtpHash] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear timer on unmount
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startTimer = () => {
    setResendTimer(TIMER_SECS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = useCallback(async () => {
    const trimmed = mobile.trim();
    if (trimmed.length < 10) {
      showToastMessage(t('FORM_ERROR_MESSAGES.ENTER_VALID_MOBILE_NUMBER'), 'error');
      return;
    }
    if (resendAttempts >= MAX_RESEND) {
      showToastMessage(t('LEARNER_APP.LOGIN.MAX_RESEND'), 'error');
      return;
    }

    setIsSendingOtp(true);
    try {
      const tenantId = localStorage.getItem('domainTenantId') || tenant?.tenantId || SWADHAAR_TENANT_ID;

      // Check user existence
      const userCheck = await checkUserExistenceWithTenant(trimmed, tenantId);
      if (
        userCheck?.params?.status === 'failed' ||
        userCheck?.responseCode === 404 ||
        (userCheck?.responseCode && userCheck.responseCode !== 200)
      ) {
        const errorMsg = userCheck?.params?.errmsg || t('LEARNER_APP.LOGIN.NOT_REGISTERED');
        showToastMessage(errorMsg, 'error');
        return;
      }

      // Send OTP
      const otpResp = await sendOTP({ mobile: trimmed, reason: 'login' });
      const hash = otpResp?.result?.data?.hash || otpResp?.result?.hash || '';
      setOtpHash(hash);
      setOtpSent(true);
      setOtp(Array(OTP_LEN).fill(''));
      setResendAttempts((prev) => prev + 1);
      startTimer();
      showToastMessage(t('OTP_SENT_SUCCESSFULLY'), 'success'); // Key might vary, using fallback for now
    } catch (err: any) {
      console.error('Send OTP error:', err);
      const errorMsg = err?.response?.data?.params?.errmsg || t('LEARNER_APP.LOGIN.SEND_OTP_ERROR');
      showToastMessage(errorMsg, 'error');
    } finally {
      setIsSendingOtp(false);
    }
  }, [mobile, resendAttempts, tenant, t]);


  const handleSignIn = async () => {
    const otpStr = otp.join('');
    if (!otpStr || otpStr.length < 4) {
      showToastMessage(t('LEARNER_APP.LOGIN.OTP_PLACEHOLDER'), 'error');
      return;
    }
    setIsSigningIn(true);
    try {
      const trimmed = mobile.trim();
      const verifyResp = await verifyOTP({ mobile: trimmed, reason: 'login', otp: otpStr, hash: otpHash });
      const token = verifyResp?.result?.token || verifyResp?.result?.access_token;

      if (!token) {
        const errorMsg = verifyResp?.params?.errmsg || t('LEARNER_APP.LOGIN.INVALID_OTP');
        showToastMessage(errorMsg, 'error');
        return;
      }

      localStorage.setItem('token', token);
      const refreshToken = verifyResp?.result?.refresh_token;
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

      // Fetch user info
      const userResp = await getUserId();
      if (!userResp) { showToastMessage('Failed to load user info.', 'error'); return; }

      // Handle nested userData if present
      const userData = userResp?.userData || userResp;

      const userRole = userData?.tenantData?.[0]?.roleName;
      const userId = userData?.userId;
      const tenantId = userData?.tenantData?.[0]?.tenantId;
      const tenantName = userData?.tenantData?.[0]?.tenantName;
      const createdAt = userData?.createdAt;

      localStorage.setItem('userId', userId);
      localStorage.setItem('token', token);
      localStorage.setItem('firstName', userData?.firstName || '');
      localStorage.setItem('name', userData?.firstName || '');
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('tenantId', tenantId);
      localStorage.setItem('userProgram', tenantName);
      localStorage.setItem('mobileNumber', userData?.mobile || trimmed);
      if (createdAt) localStorage.setItem('createdAt', createdAt);
      
      // Fetch full profile to get the image URL (stored in 'name' field)
      try {
        const fullProfile = await getUserDetails(userId, true);
        const imageUrl = fullProfile?.result?.userData?.name || fullProfile?.result?.userData?.basicDetails?.image || '';
        if (imageUrl) localStorage.setItem('profilePicture', imageUrl);
      } catch (e) { console.error('Failed to fetch full profile for image', e); }

      const templateId = userData?.tenantData?.[0]?.templateId || 'cm7nbogii000moc3gth63l863';
      localStorage.setItem('templateId', templateId);
      localStorage.setItem('templtateId', templateId);
      
      const channelId = userData?.tenantData?.[0]?.channelId;
      const collectionFramework = userData?.tenantData?.[0]?.collectionFramework;
      if (channelId) localStorage.setItem('channelId', channelId);
      if (collectionFramework) localStorage.setItem('collectionFramework', collectionFramework);

      document.cookie = `token=${token}; path=/; secure; SameSite=Strict`;

      await profileComplitionCheck().catch(() => {});
      if (tenantId) await ensureAcademicYearForTenant(tenantId).catch(() => {});

      window.location.href = `${window.location.origin}/swadhaar-home`;
    } catch (err: any) {
      console.error('Sign in error:', err);
      const errorMsg = err?.response?.data?.params?.errmsg || t('LEARNER_APP.LOGIN.INVALID_OTP');
      showToastMessage(errorMsg, 'error');
    } finally {
      setIsSigningIn(false);
    }
  };

  const canSendOtp =
    mobile.trim().length === 10 && !isSendingOtp && resendTimer === 0 && resendAttempts < MAX_RESEND;
  const canSignIn = otp.join('').length === OTP_LEN && !isSigningIn;

  const focusOtpInput = (index: number) => {
    if (index < 0 || index >= OTP_LEN) return;
    const el = document.getElementById(`swadhaar-otp-${index}`) as HTMLInputElement | null;
    el?.focus();
  };

  const setOtpDigit = (index: number, digitsToInsert: string) => {
    const clamped = digitsToInsert.replace(/\D/g, '').slice(0, OTP_LEN - index);
    if (!clamped) {
      setOtp((prev) => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
      return 0;
    }

    setOtp((prev) => {
      const next = [...prev];
      clamped.split('').forEach((d, i) => {
        next[index + i] = d;
      });
      return next;
    });

    return clamped.length;
  };

  const handleOtpChange = (index: number, rawValue: string) => {
    const digits = rawValue.replace(/\D/g, '');

    if (!digits) {
      setOtp((prev) => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
      return;
    }

    const insertedCount = setOtpDigit(index, digits);
    const nextIndex = Math.min(index + insertedCount, OTP_LEN - 1);
    if (insertedCount > 0) focusOtpInput(nextIndex);
  };

  const handleOtpPaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text') || '';
    const digits = pasted.replace(/\D/g, '');
    if (!digits) return;

    const insertedCount = setOtpDigit(index, digits);
    const nextIndex = Math.min(index + insertedCount, OTP_LEN - 1);
    focusOtpInput(nextIndex);
  };

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
           {/* Top-left: Sign In text */}
        <Typography
          variant="h3"
          sx={{
            position: 'absolute',
            top: 16,
            left: 20,
            fontWeight: 600,
            color: 'common.white',
          }}
        >
          {t('LEARNER_APP.LOGIN.SIGN_IN')}
        </Typography>
      {/* Header — dark navy (≈ 40% height) */}
      <Box
        sx={{
          bgcolor: 'info.primary',
          pt: 6,
          pb: 5,
          px: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}
      >
   

        {/* Logo */}
        <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '20px',
                overflow: 'hidden',
                mb: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image
                src="/images/swadhar_logo.png"
                alt={t('LEARNER_APP.HOME.LOGO_ALT')}
                width={120}
                height={120}
                style={{ objectFit: 'contain' }}
              />
            </Box>

        <Typography variant="h4" sx={{ fontWeight: 700, color: 'common.white', mb: 0.5 }}>
          {t('LEARNER_APP.LOGIN.WELCOME')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          {t('LEARNER_APP.LOGIN.SUBTITLE')}
        </Typography>
      </Box>

      {/* White card — rounded top corners */}
      <Box
        sx={{
          flex: 1,
          bgcolor: 'background.paper',
          borderRadius: '24px 24px 0 0',
          mt: '-16px',
          px: 3,
          pt: 3,
          pb: 4,
        }}
      >
        {/* Mobile Number */}
        <Typography  sx={{fontFamily:"Inter, sans-serif",fontSize: 13, fontWeight: 700, color: 'text.secondary', mb: 0.75 }}>
          {t('LEARNER_APP.LOGIN.MOBILE_LABEL')}
        </Typography>
        <TextField
          fullWidth
          placeholder={t('LEARNER_APP.LOGIN.MOBILE_PLACEHOLDER')}
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
          inputProps={{ inputMode: 'numeric', maxLength: 10 }}
          sx={{
            mb: 2.5,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              fontSize: 15,
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: PRIMARY },
            },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#999999ff' },
          }}
        />

        {/* OTP */}
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', mb: 0.75, fontFamily: 'Inter, sans-serif' }}>
          {t('LEARNER_APP.LOGIN.OTP_LABEL')}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.2, mb: 1 }}>
          {otp.map((digit, idx) => (
            <TextField
              key={idx}
              id={`swadhaar-otp-${idx}`}
              value={digit}
              onChange={(e) => handleOtpChange(idx, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && otp[idx] === '' && idx > 0) focusOtpInput(idx - 1);
              }}
              inputProps={{
                maxLength: 1,
                inputMode: 'numeric',
                style: { textAlign: 'center', fontSize: 20 },
                onPaste: (e: any) => handleOtpPaste(idx, e),
              }}
              sx={{
                width: 58,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  fontSize: 15,
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: PRIMARY },
                },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#999999ff' },
              }}
            />
          ))}
        </Box>

        

        {/* Sign In button */}
        <Button
          fullWidth
          onClick={handleSignIn}
          disabled={!canSignIn}
          sx={{
            py: 1.75,
            bgcolor: canSignIn ? PRIMARY : '#E5E7EB',
            color: canSignIn ? '#fff' : '#9CA3AF',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: 15,
            textTransform: 'none',
            fontFamily: 'Inter, sans-serif',
            boxShadow: canSignIn ? `0 4px 14px rgba(230,135,60,0.35)` : 'none',
            '&:hover': { bgcolor: canSignIn ? '#d4782e' : '#E5E7EB' },
            '&:disabled': { color: '#9CA3AF', bgcolor: '#E5E7EB' },
          }}
        >
          {isSigningIn ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : t('LEARNER_APP.LOGIN.SIGN_IN')}
        </Button>
        {/* Send/Resend OTP — right aligned */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3,mt:2 }}>
          <Box
            component="span"
            onClick={canSendOtp ? handleSendOtp : undefined}
            sx={{
              fontSize: 16,
              color: canSendOtp ? DARK_NAV : '#9CA3AF',
              fontWeight: 600,
              cursor: canSendOtp ? 'pointer' : 'not-allowed',
              fontFamily: 'Inter, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            {isSendingOtp ? (
              <CircularProgress size={14} sx={{ color: PRIMARY }} />
            ) : resendTimer > 0 ? (
              t('LEARNER_APP.LOGIN.RESEND_IN', { seconds: `${Math.floor(resendTimer / 60)}:${String(resendTimer % 60).padStart(2, '0')}` })
            ) : otpSent ? (
              t('LEARNER_APP.LOGIN.SEND_RESEND_OTP') // Logic shows Resend OTP
            ) : (
              t('LEARNER_APP.LOGIN.SEND_RESEND_OTP')
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}