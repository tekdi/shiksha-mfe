'use client';

import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Image from 'next/image';
import tada from '../../../public/images/tada.gif';
const SignupSuccess = () => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      flexDirection={'column'}
    >
      <Image
        src={tada}
        alt="Smiley face"
        width={30}
        height={30}
        style={{ marginBottom: '16px' }}
      />

      <Typography
        variant="h1"
        sx={{
          fontWeight: 400,
          // fontSize: '22px',
          // lineHeight: '28px',
          // letterSpacing: '0px',
          textAlign: 'center',
          verticalAlign: 'middle',
          mb: 3,
        }}
      >
        Hurray!
      </Typography>
      <Typography
        variant="h1"
        sx={{
          fontWeight: 200,
          // fontSize: '22px',
          // lineHeight: '28px',
          letterSpacing: '0px',
          textAlign: 'center',
          verticalAlign: 'middle',
          mb: 3,
        }}
      >
        You’ve successfully signed up for YouthNet!{' '}
      </Typography>
    </Box>
  );
};

export default SignupSuccess;
