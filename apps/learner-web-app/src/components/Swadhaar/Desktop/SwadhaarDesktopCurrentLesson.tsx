'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import PlayCircleFilledRoundedIcon from '@mui/icons-material/PlayCircleFilledRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useTranslation } from '@shared-lib';
const PRIMARY = '#E6873C';

interface CurrentLessonInfo {
  subtopicName: string;
  lessonName: string;
  lessonNumber: number;
  hasProgress: boolean;
}

interface SwadhaarDesktopCurrentLessonProps {
  currentLesson: CurrentLessonInfo | null;
  onStartContinue: () => void;
}

const SwadhaarDesktopCurrentLesson: React.FC<SwadhaarDesktopCurrentLessonProps> = ({
  currentLesson,
  onStartContinue,
}) => {
  const { t } = useTranslation();

  if (!currentLesson) return null;

  return (
    <Box
      id="swadhaar-desktop-current-lesson"
      sx={{
        bgcolor: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: '16px',
        p: 2,
        mb: 2.5,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* Row 1: "Current: SubtopicName" | "Start/Continue" */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
        <Typography
          sx={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: 13,
            color: '#1F2937',
          }}
        >
          {t('LEARNER_APP.LEARN.CURRENT_LABEL', { name: currentLesson.subtopicName })}
        </Typography>
        <Button
          id="swadhaar-start-continue-btn"
          onClick={onStartContinue}
          sx={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: 12,
            color: PRIMARY,
            textTransform: 'none',
            p: 0,
            minWidth: 'auto',
            '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
          }}
        >
          {currentLesson.hasProgress
            ? t('LEARNER_APP.HOME.CONTINUE_LEARNING')
            : t('LEARNER_APP.HOME.START_LEARNING')}
        </Button>
      </Box>

      {/* Lesson label */}
      <Typography
        sx={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 11,
          color: '#9CA3AF',
          mb: 1,
        }}
      >
        {t('LEARNER_APP.LEARN.LESSON_LABEL', { name: `${currentLesson.lessonNumber}` })}
      </Typography>

      {/* Lesson row */}
      <Box
        onClick={onStartContinue}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: '#FAFAFA',
          border: `1.5px solid ${PRIMARY}`,
          borderRadius: '12px',
          px: 2,
          py: 1.25,
          cursor: 'pointer',
          transition: 'all 0.15s',
          '&:hover': { bgcolor: '#FEF3E8', boxShadow: `0 2px 8px rgba(230,135,60,0.2)` },
        }}
      >
        <PlayCircleFilledRoundedIcon sx={{ fontSize: 28, color: PRIMARY, flexShrink: 0 }} />
        <Typography
          sx={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: 13,
            color: '#1F2937',
            flex: 1,
          }}
        >
          {currentLesson.lessonName}
        </Typography>
        <ArrowForwardRoundedIcon sx={{ fontSize: 20, color: PRIMARY }} />
      </Box>
    </Box>
  );
};

export default SwadhaarDesktopCurrentLesson;
