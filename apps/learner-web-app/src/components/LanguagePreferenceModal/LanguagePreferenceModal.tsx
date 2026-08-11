'use client';

import React from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

import { extractCourseLanguages, getLanguageDisplayInfo, LanguageDisplayInfo } from '@learner/utils/courseLanguageUtils';

const PRIMARY = '#E6873C';
const DARK = '#1C2B4A';

export type SupportedLanguage = string;

const DEFAULT_LANGUAGE_OPTIONS: LanguageDisplayInfo[] = [
  {
    code: 'English',
    label: 'English',
    nativeLabel: 'English',
    emoji: '🇬🇧',
    description: 'Learn in English',
  },
  {
    code: 'Hindi',
    label: 'Hindi',
    nativeLabel: 'हिंदी',
    emoji: '🇮🇳',
    description: 'हिंदी में सीखें',
  },
  {
    code: 'Marathi',
    label: 'Marathi',
    nativeLabel: 'मराठी',
    emoji: '🏛️',
    description: 'मराठीत शिका',
  },
];

interface LanguagePreferenceModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (language: string) => void;
  selectedLanguage?: string | null;
  availableLanguages?: string[];
  course?: any;
}

const LanguagePreferenceModal: React.FC<LanguagePreferenceModalProps> = ({
  open,
  onClose,
  onSelect,
  selectedLanguage,
  availableLanguages,
  course,
}) => {
  const [fetchedLanguages, setFetchedLanguages] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (open && (!availableLanguages || availableLanguages.length === 0) && !course) {
      const loadSearchLanguages = async () => {
        try {
          const { fetchAvailableCourseLanguagesFromSearch } = await import('@learner/utils/API/SwadhaarService');
          const langs = await fetchAvailableCourseLanguagesFromSearch();
          if (langs && langs.length > 0) {
            setFetchedLanguages(langs);
          }
        } catch (e) {
          console.error('Error fetching dynamic course languages for modal:', e);
        }
      };
      loadSearchLanguages();
    }
  }, [open, availableLanguages, course]);

  const handleSelect = (lang: string) => {
    onSelect(lang);
  };

  const optionsToRender: LanguageDisplayInfo[] = React.useMemo(() => {
    let languages: string[] = [];
    if (availableLanguages && availableLanguages.length > 0) {
      languages = availableLanguages;
    } else if (course) {
      languages = extractCourseLanguages(course);
    } else if (fetchedLanguages && fetchedLanguages.length > 0) {
      languages = fetchedLanguages;
    }

    if (languages.length > 0) {
      return languages.map((lang) => getLanguageDisplayInfo(lang));
    }

    return DEFAULT_LANGUAGE_OPTIONS;
  }, [availableLanguages, course, fetchedLanguages]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: { xs: 340, sm: 420 },
          bgcolor: '#FFFFFF',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(28,43,74,0.25)',
          outline: 'none',
          mx: 2,
        }}
      >
        {/* ── Header gradient banner ── */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${DARK} 0%, #2D4270 60%, #1C2B4A 100%)`,
            px: 3,
            pt: 3,
            pb: 3,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative circles */}
          <Box
            sx={{
              position: 'absolute',
              top: -24,
              right: -24,
              width: 100,
              height: 100,
              borderRadius: '50%',
              bgcolor: 'rgba(230,135,60,0.18)',
              filter: 'blur(20px)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -12,
              left: 60,
              width: 60,
              height: 60,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.06)',
              filter: 'blur(10px)',
            }}
          />

          {/* Close button */}
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              color: 'rgba(255,255,255,0.7)',
              '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' },
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>

          {/* Icon + title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, position: 'relative', zIndex: 1 }}>
            {/* <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${PRIMARY}, #D1752D)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(230,135,60,0.4)',
              }}
            >
              <TranslateRoundedIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Box> */}
            {/* <Box>
              <Typography
                sx={{
                  fontFamily: 'Open Sans, sans-serif',
                  fontWeight: 800,
                  fontSize: 18,
                  color: '#fff',
                  lineHeight: 1.2,
                }}
              >
                Choose Your Language
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.65)',
                  mt: 0.25,
                }}
              >
                भाषा निवडा · भाषा चुनें
              </Typography>
            </Box> */}
          </Box>

          <Typography
            sx={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 13,
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.5,
              position: 'relative',
              zIndex: 1,
            }}
          >
            Select your preferred language to see courses available in that language.
          </Typography>
        </Box>

        {/* ── Language options ── */}
        <Box sx={{ px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {optionsToRender.map((opt) => {
            const isSelected = selectedLanguage === opt.code;
            return (
              <Box
                key={opt.code}
                id={`lang-option-${opt.code.toLowerCase()}`}
                onClick={() => handleSelect(opt.code)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  px: 2.5,
                  py: 2,
                  borderRadius: '16px',
                  border: `2px solid ${isSelected ? PRIMARY : '#E5E7EB'}`,
                  bgcolor: isSelected ? 'rgba(230,135,60,0.05)' : '#FAFAFA',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    borderColor: PRIMARY,
                    bgcolor: 'rgba(230,135,60,0.04)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(230,135,60,0.12)',
                  },
                }}
              >
                {/* Subtle gradient fill on selection */}
                {isSelected && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(90deg, rgba(230,135,60,0.06) 0%, transparent 100%)',
                      borderRadius: 'inherit',
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {/* Emoji */}
                {/* <Box
                  sx={{
                    fontSize: 28,
                    lineHeight: 1,
                    flexShrink: 0,
                    filter: isSelected ? 'none' : 'grayscale(0.2)',
                  }}
                >
                  {opt.emoji}
                </Box> */}

                {/* Text */}
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontFamily: 'Open Sans, sans-serif',
                      fontWeight: 700,
                      fontSize: 15,
                      color: isSelected ? PRIMARY : '#1A1A1A',
                      lineHeight: 1.2,
                    }}
                  >
                    {opt.nativeLabel}
                    {opt.nativeLabel !== opt.label && (
                      <Typography
                        component="span"
                        sx={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          fontSize: 12,
                          color: '#9CA3AF',
                          ml: 1,
                        }}
                      >
                        ({opt.label})
                      </Typography>
                    )}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 11,
                      color: isSelected ? 'rgba(230,135,60,0.8)' : '#9CA3AF',
                      mt: 0.25,
                    }}
                  >
                    {opt.description}
                  </Typography>
                </Box>

                {/* Check indicator */}
                {isSelected ? (
                  <CheckCircleRoundedIcon sx={{ color: PRIMARY, fontSize: 22, flexShrink: 0 }} />
                ) : (
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: '2px solid #D1D5DB',
                      flexShrink: 0,
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>

        {/* ── Footer hint ── */}
        <Box
          sx={{
            px: 3,
            pb: 3,
            pt: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            sx={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 11,
              color: '#9CA3AF',
              textAlign: 'center',
            }}
          >
            Your preference will be saved for future sessions.
          </Typography>
        </Box>
      </Box>
    </Modal>
  );
};

export default LanguagePreferenceModal;
