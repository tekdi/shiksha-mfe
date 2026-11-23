import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { CourseLanguageCode, courseLanguageLabelKey } from '@/services/CourseService';

interface CourseLanguageTagsProps {
  /** The course's own language */
  languageCode?: CourseLanguageCode;
  /** Every language the course has a live version in, its own included (Task 35) */
  availableLanguages?: CourseLanguageCode[];
  /** 'row' keeps the chip and "Also in …" on one line (pickers, path steps) */
  direction?: 'row' | 'column';
}

/** The course's language chip, plus "Also in Hindi, Marathi" when other language versions exist */
const CourseLanguageTags: React.FC<CourseLanguageTagsProps> = ({
  languageCode,
  availableLanguages = [],
  direction = 'column',
}) => {
  const { t } = useTranslation();
  const others = availableLanguages.filter((code) => code !== languageCode);
  const row = direction === 'row';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: direction,
        alignItems: row ? 'center' : 'flex-start',
        gap: row ? 0.75 : 0.5,
        flexShrink: 0,
      }}
    >
      <Chip
        label={t(courseLanguageLabelKey(languageCode))}
        size="small"
        sx={{
          fontWeight: 500,
          fontSize: '11px',
          backgroundColor: '#F3F4F6',
          color: '#374151',
          borderRadius: '4px',
          height: 22,
        }}
      />
      {others.length > 0 && (
        <Typography sx={{ fontSize: '11px', color: '#6B7280', whiteSpace: 'nowrap' }}>
          {t('COURSES.LIST.ALSO_IN', {
            languages: others.map((code) => t(courseLanguageLabelKey(code))).join(', '),
          })}
        </Typography>
      )}
    </Box>
  );
};

export default CourseLanguageTags;
