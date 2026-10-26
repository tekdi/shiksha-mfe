import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Paper,
} from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useTranslation, UserConfig } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../next-i18next.config.js';
import {
  checkAdminUserExistence,
  sendOTP,
  verifyOTP,
  getUserAuth,
  getUserDetails,
} from '@/services/LoginService';
import { showToastMessage } from '@/components/Toastify';
import { SWADHAAR_TENANT_ID } from '@/utils/app.constant';

const PRIMARY = '#E6873C';
const DARK_NAV = '#1C2B4A';
const TIMER_SECS = 60;
const MAX_RESEND = 3;
const OTP_LEN = 6;
const OTP_SLOT_IDS = Array.from({ length: OTP_LEN }, (_, i) => `swadhaar-otp-${i}`);

interface ApiError {
  response?: { data?: { params?: { errmsg?: string }; message?: string } };
}

/** Extracts the server-provided error message from an axios-style error, if any. */
const getApiErrorMessage = (err: unknown): string | undefined => {
  const data = (err as ApiError)?.response?.data;
  return data?.params?.errmsg || data?.message;
};

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation('common');

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LEN).fill(''));
  const [otpHash, setOtpHash] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check if user is already authenticated
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      if (token && userId) {
        router.replace('/users');
      } else {
        setIsCheckingAuth(false);
      }
    }
  }, [router]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = () => {
    setResendTimer(TIMER_SECS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

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

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      focusOtpInput(index - 1);
    }
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

  /**
   * Send OTP flow:
   * 1. Query /user/list with role: Admin and tenantId to verify user is an Admin
   * 2. Call /user/send-otp
   */
  const handleSendOtp = useCallback(async () => {
    const trimmed = mobile.trim();
    if (trimmed.length !== 10) {
      showToastMessage(t('LOGIN_PAGE.INVALID_MOBILE'), 'warning');
      return;
    }
    if (resendAttempts >= MAX_RESEND) {
      showToastMessage(t('LOGIN_PAGE.MAX_RESEND_REACHED'), 'error');
      return;
    }

    setIsSendingOtp(true);
    try {
      // Step 1: Check user existence with Admin role in Swadhaar
      const checkResp = await checkAdminUserExistence(trimmed, SWADHAAR_TENANT_ID);
      const userList =
        checkResp?.result?.getUserDetails ||
        checkResp?.result?.users ||
        checkResp?.result?.userData ||
        checkResp?.result;

      if (!userList || (Array.isArray(userList) && userList.length === 0)) {
        showToastMessage(t('LOGIN_PAGE.NO_ADMIN_ACCOUNT'), 'error');
        return;
      }

      // Step 2: Send OTP
      const otpResp = await sendOTP(trimmed, 'login');
      const hash =
        otpResp?.result?.data?.hash ||
        otpResp?.result?.hash ||
        otpResp?.data?.hash ||
        otpResp?.hash ||
        '';

      setOtpHash(hash);
      setOtpSent(true);
      setOtp(new Array(OTP_LEN).fill(''));
      setResendAttempts((prev) => prev + 1);
      startTimer();
      showToastMessage(t('LOGIN_PAGE.OTP_SENT_SUCCESS'), 'success');

      // Auto-focus first digit
      setTimeout(() => focusOtpInput(0), 100);
    } catch (err: unknown) {
      console.error('Send OTP error:', err);
      const errorMsg =
        getApiErrorMessage(err) || t('LOGIN_PAGE.SEND_OTP_FAILED');
      showToastMessage(errorMsg, 'error');
    } finally {
      setIsSendingOtp(false);
    }
  }, [mobile, resendAttempts, t]);

  /**
   * Verify OTP and Login:
   * 1. /user/verify-otp with mobile, reason, otp, hash
   * 2. /user/auth with Bearer token
   * 3. /user/read/{userId}?fieldvalue=true
   * 4. Persist session and redirect to /dashboard
   */
  const handleSignIn = async () => {
    const otpStr = otp.join('');
    if (!otpStr || otpStr.length < OTP_LEN) {
      showToastMessage(t('LOGIN_PAGE.INCOMPLETE_OTP', { digits: OTP_LEN }), 'warning');
      return;
    }

    setIsSigningIn(true);
    try {
      const trimmed = mobile.trim();
      const verifyResp = await verifyOTP({
        mobile: trimmed,
        reason: 'login',
        otp: otpStr,
        hash: otpHash,
      });

      const token =
        verifyResp?.result?.token ||
        verifyResp?.result?.access_token ||
        verifyResp?.token ||
        verifyResp?.access_token;

      if (!token) {
        const errorMsg =
          verifyResp?.params?.errmsg ||
          verifyResp?.message ||
          t('LOGIN_PAGE.INVALID_OTP');
        showToastMessage(errorMsg, 'error');
        return;
      }

      const refreshToken =
        verifyResp?.result?.refresh_token || verifyResp?.refresh_token || '';

      // Step 4: Fetch user session info via /user/auth
      const authResp = await getUserAuth(token);
      const authData = authResp?.result?.userData || authResp?.userData || authResp?.result || {};
      const userId =
        authData?.userId || authData?.sub || authData?.id || verifyResp?.result?.userId;
      const firstName = authData?.firstName || authData?.given_name || '';
      const lastName = authData?.lastName || authData?.family_name || '';
      const fullName =
        `${firstName} ${lastName}`.trim() ||
        authData?.name ||
        authData?.preferred_username ||
        'Administrator';
      const userRole =
        authData?.tenantData?.[0]?.roleName || authData?.user_roles || 'admin';

      // Step 5: Read full profile if userId exists
      if (userId) {
        try {
          const profileResp = await getUserDetails(userId, token);
          const userData = profileResp?.result?.userData || profileResp?.userData;
          if (userData?.tenantData?.[0]?.channelId) {
            localStorage.setItem('channelId', userData.tenantData[0].channelId);
          }
        } catch (e) {
          console.warn('Profile read fallback:', e);
        }
      }

      // Persist Admin session
      localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userId', userId || '');
      localStorage.setItem('tenantId', SWADHAAR_TENANT_ID);
      localStorage.setItem('mobileNumber', trimmed);
      localStorage.setItem(
        'adminInfo',
        JSON.stringify({
          userId: userId || 'admin-01',
          name: fullName,
          username: trimmed,
          role: userRole,
          roles: ['admin'],
          tenantId: SWADHAAR_TENANT_ID,
        })
      );

      // Set cookie for SSR/middleware compatibility
      document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;

      showToastMessage(t('LOGIN_PAGE.LOGIN_SUCCESS'), 'success');
      const returnUrl = (router.query.returnUrl as string) || '/dashboard';
      router.push(returnUrl);
    } catch (err: unknown) {
      console.error('Sign in error:', err);
      const errorMsg = getApiErrorMessage(err) || t('LOGIN_PAGE.SIGN_IN_FAILED');
      showToastMessage(errorMsg, 'error');
    } finally {
      setIsSigningIn(false);
    }
  };

  const canSendOtp =
    mobile.trim().length === 10 &&
    !isSendingOtp &&
    resendTimer === 0 &&
    resendAttempts < MAX_RESEND;

  const canSignIn =
    mobile.trim().length === 10 && otp.join('').length === OTP_LEN && !isSigningIn;

  const resendLabel = () => {
    if (isSendingOtp) return <CircularProgress size={14} sx={{ color: PRIMARY }} />;
    if (resendTimer > 0) {
      const mins = Math.floor(resendTimer / 60);
      const secs = String(resendTimer % 60).padStart(2, '0');
      return t('LOGIN_PAGE.RESEND_IN', { time: `${mins}:${secs}` });
    }
    return t('LOGIN_PAGE.SEND_RESEND_OTP');
  };

  if (isCheckingAuth) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: DARK_NAV,
        }}
      >
        <CircularProgress sx={{ color: PRIMARY }} />
      </Box>
    );
  }

  return (
    <Box
      id="swadhaar-login-page"
      sx={{
        minHeight: '100vh',
        bgcolor: DARK_NAV,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1C2B4A 0%, #243660 100%)',
        p: 2,
      }}
    >
      <Paper
        id="swadhaar-login-card"
        elevation={0}
        sx={{
          bgcolor: '#FFFFFF',
          borderRadius: '24px',
          p: { xs: '32px 24px', sm: '36px 40px' },
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
        }}
      >
        {/* Swadhaar Logo & Header */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 76,
              height: 76,
              borderRadius: '16px',
              overflow: 'hidden',
              mb: 1.5,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFFFFF',
            }}
          >
            <Image
              src="/images/swadhar_logo.png"
              alt={t('LAYOUT.LOGO_ALT')}
              width={76}
              height={76}
              style={{ objectFit: 'contain' }}
              priority
            />
          </Box>
          <Typography
            sx={{
              fontFamily: "'Inter', 'Poppins', sans-serif",
              fontWeight: 700,
              fontSize: 22,
              color: '#1A1A1A',
            }}
          >
            {t('LOGIN_PAGE.SIGN_IN')}
          </Typography>
          <Typography
            sx={{
              fontFamily: "'Inter', 'Poppins', sans-serif",
              fontWeight: 400,
              fontSize: 13,
              color: '#6B7280',
              mt: 0.5,
            }}
          >
            {t('LOGIN_PAGE.SIGN_IN_TO_CONTINUE')}
          </Typography>
        </Box>

        {/* Mobile Number Field */}
        <Typography
          sx={{
            fontFamily: "'Inter', 'Poppins', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            color: '#1A1A1A',
            mb: 0.75,
          }}
        >
          {t('LOGIN_PAGE.MOBILE_NUMBER')}
        </Typography>
        <TextField
          id="swadhaar-mobile-input"
          fullWidth
          size="small"
          placeholder={t('LOGIN_PAGE.MOBILE_PLACEHOLDER')}
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
          inputProps={{ inputMode: 'numeric', maxLength: 10, 'aria-label': t('LOGIN_PAGE.MOBILE_NUMBER') }}
          sx={{
            mb: 2.5,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              fontSize: 14,
              fontFamily: "'Inter', 'Poppins', sans-serif",
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: PRIMARY },
            },
          }}
        />

        {/* 6-Digit OTP Field */}
        <Typography
          sx={{
            fontFamily: "'Inter', 'Poppins', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            color: '#1A1A1A',
            mb: 0.75,
          }}
        >
          {t('LOGIN_PAGE.OTP')}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 2.75 }}>
          {OTP_SLOT_IDS.map((slotId, idx) => (
            <TextField
              key={slotId}
              id={slotId}
              value={otp[idx]}
              disabled={!otpSent}
              onChange={(e) => handleOtpChange(idx, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(idx, e as React.KeyboardEvent<HTMLInputElement>)}
              inputProps={{
                maxLength: 1,
                inputMode: 'numeric',
                'aria-label': t('LOGIN_PAGE.OTP_DIGIT', { index: idx + 1 }),
                style: {
                  textAlign: 'center',
                  fontSize: 16,
                  fontWeight: 600,
                  fontFamily: "'Inter', 'Poppins', sans-serif",
                  padding: '10px 0',
                },
                onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => handleOtpPaste(idx, e),
              }}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  fontFamily: "'Inter', 'Poppins', sans-serif",
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: PRIMARY },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: otp[idx] ? PRIMARY : '#D1D5DB',
                    borderWidth: otp[idx] ? 2 : 1,
                  },
                },
              }}
            />
          ))}
        </Box>

        {/* Sign In Button */}
        <Button
          id="swadhaar-signin-btn"
          fullWidth
          onClick={handleSignIn}
          disabled={!canSignIn}
          sx={{
            py: 1.5,
            bgcolor: canSignIn ? PRIMARY : '#E5E7EB',
            color: canSignIn ? '#FFFFFF' : '#9CA3AF',
            borderRadius: '10px',
            fontFamily: "'Inter', 'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 15,
            textTransform: 'none',
            boxShadow: canSignIn ? '0 4px 16px rgba(230, 135, 60, 0.35)' : 'none',
            transition: 'all 0.2s',
            '&:hover': { bgcolor: canSignIn ? '#D4782E' : '#E5E7EB' },
            '&:disabled': { color: '#9CA3AF', bgcolor: '#E5E7EB' },
          }}
        >
          {isSigningIn ? (
            <CircularProgress size={20} sx={{ color: '#FFFFFF' }} />
          ) : (
            t('LOGIN_PAGE.SIGN_IN')
          )}
        </Button>

        {/* Send / Resend OTP Action */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5 }}>
          <Box
            id="swadhaar-send-otp-btn"
            component="span"
            onClick={canSendOtp ? handleSendOtp : undefined}
            sx={{
              fontFamily: "'Inter', 'Poppins', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: canSendOtp ? PRIMARY : '#9CA3AF',
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
      </Paper>
    </Box>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'], nextI18NextConfig as UserConfig, ['en', 'mr', 'hi'])),
    },
  };
}
