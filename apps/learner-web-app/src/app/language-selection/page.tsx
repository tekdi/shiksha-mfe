'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { useTranslation } from '@shared-lib';

const LANGUAGES = [
  { code: 'en', display: 'English', native: 'English' },
  { code: 'hi', display: 'Hindi', native: 'हिंदी' },
  { code: 'mr', display: 'Marathi', native: 'मराठी' },
];

export default function LanguageSelectionPage() {
  const router = useRouter();
  const { setLanguage } = useTranslation();

  const [selected, setSelected] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedLanguage') || 'en';
    }
    return 'en';
  });

  const handleContinue = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', selected);
    }
    setLanguage(selected);
    router.push('/swadhaar-login');
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: '#F5F5F5',
        display: 'flex',
        flexDirection: 'column',
        px: 3,
        py: 5,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 5, mt: 3 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 22,
            color: '#1F2937',
            mb: 1,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Choose Language
        </Typography>
        <Typography
          sx={{
            fontSize: 14,
            color: '#6B7280',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Select the language you&apos;re most comfortable with
        </Typography>
      </Box>

      {/* Language Options */}
      <Box sx={{ flex: 1 }}>
        {LANGUAGES.map((lang) => {
          const isSelected = selected === lang.code;
          return (
            <Box
              key={lang.code}
              onClick={() => setSelected(lang.code)}
              sx={{
                border: `2px solid ${isSelected ? '#E6873C' : '#E5E7EB'}`,
                bgcolor: isSelected ? '#FEF3E8' : '#FFFFFF',
                borderRadius: '10px',
                px: 2,
                py: 1.75,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: 15,
                    color: isSelected ? '#E6873C' : '#1F2937',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {lang.display}
                </Typography>
                {lang.native !== lang.display && (
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: '#6B7280',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {lang.native}
                  </Typography>
                )}
              </Box>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: `2px solid ${isSelected ? '#E6873C' : '#D1D5DB'}`,
                  bgcolor: isSelected ? '#E6873C' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {isSelected && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#fff',
                    }}
                  />
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Continue Button */}
      <Button
        fullWidth
        onClick={handleContinue}
        disabled={!selected}
        sx={{
          py: 1.75,
          mt: 3,
          bgcolor: '#E6873C',
          color: '#fff',
          borderRadius: '10px',
          fontWeight: 600,
          fontSize: 15,
          textTransform: 'none',
          fontFamily: 'Inter, sans-serif',
          boxShadow: '0 4px 14px rgba(230,135,60,0.35)',
          '&:hover': { bgcolor: '#d4782e' },
          '&:disabled': { bgcolor: '#E5E7EB', color: '#9CA3AF' },
        }}
      >
        Continue
      </Button>
    </Box>
  );
}
