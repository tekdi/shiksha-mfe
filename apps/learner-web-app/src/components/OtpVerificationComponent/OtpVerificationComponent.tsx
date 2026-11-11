'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, Button, Stack } from '@mui/material';

const OtpVerificationComponent = ({
  maskedNumber,
  onResend,
  otp,
  setOtp,
}: {
  maskedNumber?: string;
  onResend?: () => void;
  otp: string[];
  setOtp: any;
}) => {
  // const [otp, setOtp] = useState<string[]>(['', '', '', '']);
  const [timer, setTimer] = useState(120);

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const focusInput = (index: number) => {
    if (index < 0 || index >= otp.length) return;
    const nextInput = document.getElementById(`otp-${index}`);
    if (nextInput) (nextInput as HTMLInputElement).focus();
  };

  const handleChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, '');
    const newOtp = [...otp];

    // Clearing current box
    if (!digits) {
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    // Support typing/autofill/paste where multiple digits arrive at once
    let pos = index;
    digits
      .slice(0, otp.length - index)
      .split('')
      .forEach((d) => {
        newOtp[pos] = d;
        pos += 1;
      });

    setOtp(newOtp);
    // Focus first box after inserted digits
    const nextPos = index + digits.length;
    if (nextPos < otp.length) focusInput(nextPos);
  };

  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text') || '';
    const digits = pasted.replace(/\D/g, '');
    if (!digits) return;

    const newOtp = [...otp];
    let pos = index;
    for (const d of digits) {
      if (pos >= otp.length) break;
      newOtp[pos] = d;
      pos += 1;
    }
    setOtp(newOtp);

    // Focus next empty, otherwise last filled
    const nextEmpty = newOtp.findIndex((v, i) => i >= index && v === '');
    if (nextEmpty !== -1) focusInput(nextEmpty);
    else focusInput(otp.length - 1);
  };

  const handleResend = () => {
    setTimer(120);
    setOtp(new Array(otp.length).fill(''));
    onResend?.();
  };

  return (
    <Box textAlign="center" p={4}>
      <Typography mb={2}>
        We’ve sent an OTP to verify your number <strong>{maskedNumber}</strong>
      </Typography>

      <Stack direction="row" justifyContent="center" spacing={{ xs: 1, sm: 2 }} mb={2}>
        {otp.map((digit, idx) => (
          <TextField
            key={idx}
            id={`otp-${idx}`}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && otp[idx] === '' && idx > 0) focusInput(idx - 1);
            }}
            inputProps={{
              maxLength: 1,
              inputMode: 'numeric',
              style: { textAlign: 'center', fontSize: '20px' },
              onPaste: (e: any) => handlePaste(idx, e),
            }}
            sx={{
              flex: 1,
              minWidth: 0,
              maxWidth: 50,
              '& .MuiInputBase-input': {
                p: { xs: '12px 4px', sm: '16.5px 14px' },
              },
            }}
          />
        ))}
      </Stack>

      <Typography
        variant="body2"
        color="primary"
        sx={{ cursor: timer === 0 ? 'pointer' : 'default' }}
        onClick={timer === 0 ? handleResend : undefined}
      >
        {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
      </Typography>
    </Box>
  );
};
export default OtpVerificationComponent;
