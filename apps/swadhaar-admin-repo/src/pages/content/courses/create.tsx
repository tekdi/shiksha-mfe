import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Box, Typography, Paper, Grid, IconButton, Tooltip, Alert } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../../next-i18next.config.js';
import CommonButton from '@/components/common/CommonButton';
import CommonTextField from '@/components/common/CommonTextField';
import CommonRadioGroup from '@/components/common/CommonRadioGroup';
import FieldLabel from '@/components/common/FieldLabel';
import { BRAND, NEUTRAL } from '@/styles/customTheme';

interface ObjectiveItem {
  id: string;
  text: string;
}

const COURSES_LIST_PATH = '/content/courses';

const LANGUAGE_OPTIONS = [
  { value: 'hindi', labelKey: 'COURSES.LANGUAGE_HINDI' },
  { value: 'english', labelKey: 'COURSES.LANGUAGE_ENGLISH' },
];

const CARD_SX = {
  border: `1px solid ${NEUTRAL.border}`,
  borderRadius: '10px',
  backgroundColor: 'background.paper',
  overflow: 'hidden',
};

const CARD_HEADER_SX = {
  px: 2.5,
  py: 1.8,
  borderBottom: `1px solid ${NEUTRAL.divider}`,
};

const CARD_TITLE_SX = { fontSize: '15px', fontWeight: 600, color: NEUTRAL.ink };

const TOOLBAR_ITEM_SX = {
  cursor: 'pointer',
  px: 0.6,
  py: 0.2,
  borderRadius: '3px',
  '&:hover': { backgroundColor: '#EEEDE9', color: NEUTRAL.ink },
};

const TOOLBAR_ITEMS: { labelKey: string; display?: string; displayKey?: string; sx: object }[] = [
  { labelKey: 'COURSES.EDITOR.BOLD', display: 'B', sx: { fontWeight: 700, fontSize: '13px' } },
  { labelKey: 'COURSES.EDITOR.ITALIC', display: 'I', sx: { fontStyle: 'italic', fontSize: '13px' } },
  { labelKey: 'COURSES.EDITOR.UNDERLINE', display: 'U', sx: { textDecoration: 'underline', fontSize: '13px' } },
  {
    labelKey: 'COURSES.EDITOR.BULLETED_LIST',
    displayKey: 'COURSES.EDITOR.LIST',
    sx: { fontSize: '12px', fontWeight: 500 },
  },
  {
    labelKey: 'COURSES.EDITOR.INSERT_LINK',
    displayKey: 'COURSES.EDITOR.LINK',
    sx: { fontSize: '12px', fontWeight: 500 },
  },
];

const OBJECTIVE_MOVE_BUTTON_SX = {
  width: 22,
  height: 18,
  padding: 0,
  borderRadius: '3px',
  border: `1px solid ${NEUTRAL.border}`,
  backgroundColor: 'background.paper',
  color: '#3D3B37',
  '&:hover': { backgroundColor: '#F3F4F6' },
  '&.Mui-disabled': { opacity: 0.35 },
};

export default function CreateCoursePage() {
  const router = useRouter();
  const { t } = useTranslation();

  // Form States matching Prototype
  const [courseName, setCourseName] = useState<string>('');
  const [targetAudience, setTargetAudience] = useState<string>(
    'New field trainers and Community Resource Persons joining Swadhaar FinAccess'
  );
  const [learningDuration, setLearningDuration] = useState<string>('45');
  const [assessmentDuration, setAssessmentDuration] = useState<string>('15');
  const [deliveryMode, setDeliveryMode] = useState<string>('Online learning via LMS');
  const [introduction, setIntroduction] = useState<string>(
    'Welcome to your very first step as a Swadhaar FinAccess field trainer…'
  );
  const [howItWorks, setHowItWorks] = useState<string>(
    'Complete each section and pass its assessment. Score 70% or above on the final assessment to progress to the next course…'
  );

  // Objectives List
  const [objectives, setObjectives] = useState<ObjectiveItem[]>([
    {
      id: 'obj-1',
      text: 'Enhanced understanding of Swadhaar FinAccess, what it does, and why its work matters…',
    },
    {
      id: 'obj-2',
      text: "Describe Swadhaar's reach, history, and values…",
    },
    {
      id: 'obj-3',
      text: 'Introduce and explain the Swadhaar Saathi Chatbot to clients…',
    },
  ]);

  // Language state (single select)
  const [language, setLanguage] = useState<string>('english');

  // UI feedback states
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Objectives reordering
  const handleMoveObjective = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= objectives.length) return;

    const updated = [...objectives];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setObjectives(updated);
  };

  const handleUpdateObjective = (index: number, text: string) => {
    setObjectives(objectives.map((obj, idx) => (idx === index ? { ...obj, text } : obj)));
  };

  const handleAddObjective = () => {
    setObjectives((prev) => [
      ...prev,
      {
        id: `obj-${Date.now()}`,
        text: '',
      },
    ]);
  };

  const handleDeleteObjective = (index: number) => {
    if (objectives.length <= 1) return;
    setObjectives((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Save actions
  const validateForm = () => {
    if (!courseName.trim()) {
      setError(t('COURSES.CREATE.NAME_REQUIRED'));
      return false;
    }
    setError(null);
    return true;
  };

  const handleSaveAsDraft = () => {
    if (!validateForm()) return;
    setSuccessMsg(t('COURSES.CREATE.SAVED_AS_DRAFT', { name: courseName }));
    setTimeout(() => {
      router.push(COURSES_LIST_PATH);
    }, 1200);
  };

  const handleSaveAndAddSections = () => {
    if (!validateForm()) return;
    setSuccessMsg(t('COURSES.CREATE.CREATED_OPENING_STRUCTURE'));
    setTimeout(() => {
      router.push({
        pathname: '/content/courses/new',
        query: {
          title: courseName,
          audience: targetAudience,
          language: language,
        },
      });
    }, 1000);
  };

  return (
    <Box sx={{ py: 1, maxWidth: 1400, mx: 'auto' }}>
      {/* Breadcrumb Navigation matching prototype */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 2, fontSize: '13px', color: NEUTRAL.muted }}>
        <span>{t('COURSES.BREADCRUMB_LEARNING')}</span>
        <span>/</span>
        <Link
          href={COURSES_LIST_PATH}
          style={{ color: NEUTRAL.muted, textDecoration: 'none', transition: 'color 0.2s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = BRAND.primary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = NEUTRAL.muted)}
        >
          {t('COURSES.BREADCRUMB_COURSES')}
        </Link>
        <span>/</span>
        <Typography component="span" sx={{ color: NEUTRAL.ink, fontWeight: 600, fontSize: '13px' }}>
          {t('COURSES.CREATE.TITLE')}
        </Typography>
      </Box>

      {/* Header and Actions Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '26px' }}>
            {t('COURSES.CREATE.TITLE')}
          </Typography>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#EEF2FF',
              color: '#3730A3',
              fontSize: '11px',
              fontFamily: 'monospace',
              fontWeight: 600,
              px: 1,
              py: 0.4,
              borderRadius: '4px',
            }}
          >
            {t('COURSES.CREATE.DOC_TAG')}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CommonButton variant="outlined" onClick={() => router.push(COURSES_LIST_PATH)}>
            {t('COMMON.CANCEL')}
          </CommonButton>

          <CommonButton variant="outlined" onClick={handleSaveAsDraft}>
            {t('COURSES.SAVE_AS_DRAFT')}
          </CommonButton>

          <CommonButton variant="primary" onClick={handleSaveAndAddSections}>
            {t('COURSES.CREATE.SAVE_AND_ADD_SECTIONS')}
          </CommonButton>
        </Box>
      </Box>

      {/* Notifications */}
      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '6px' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 2.5, borderRadius: '6px' }} onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {/* 2-Column Layout matching Prototype */}
      <Grid container spacing={2.5}>
        {/* Left Column (8 cols): Course Overview + Objectives */}
        <Grid item xs={12} lg={8}>
          {/* Card 1: Course Overview */}
          <Paper elevation={0} sx={{ ...CARD_SX, mb: 2.5 }}>
            <Box sx={{ ...CARD_HEADER_SX, display: 'flex', alignItems: 'center' }}>
              <Typography sx={CARD_TITLE_SX}>{t('COURSES.CREATE.COURSE_OVERVIEW')}</Typography>
            </Box>

            <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.2 }}>
              {/* Course Name */}
              <CommonTextField
                id="course-name"
                label={t('COURSES.CREATE.COURSE_NAME')}
                required
                value={courseName}
                onChange={(e) => {
                  setCourseName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={t('COURSES.CREATE.COURSE_NAME_PLACEHOLDER')}
              />

              {/* Target Audience */}
              <CommonTextField
                id="course-target-audience"
                label={t('COURSES.CREATE.TARGET_AUDIENCE')}
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder={t('COURSES.CREATE.TARGET_AUDIENCE_PLACEHOLDER')}
              />

              {/* 3-column Durations & Mode */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <CommonTextField
                    id="course-learning-duration"
                    label={t('COURSES.CREATE.LEARNING_CONTENT_MIN')}
                    value={learningDuration}
                    onChange={(e) => setLearningDuration(e.target.value)}
                    placeholder="45"
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <CommonTextField
                    id="course-assessment-duration"
                    label={t('COURSES.CREATE.ASSESSMENT_MIN')}
                    value={assessmentDuration}
                    onChange={(e) => setAssessmentDuration(e.target.value)}
                    placeholder="15"
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <CommonTextField
                    id="course-delivery-mode"
                    label={t('COURSES.CREATE.DELIVERY_MODE')}
                    value={deliveryMode}
                    onChange={(e) => setDeliveryMode(e.target.value)}
                    placeholder={t('COURSES.CREATE.DELIVERY_MODE_PLACEHOLDER')}
                  />
                </Grid>
              </Grid>

              {/* Introduction with Rich Text Toolbar */}
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <FieldLabel label={t('COURSES.CREATE.INTRODUCTION')} htmlFor="course-introduction" />
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 1.5,
                    py: 0.8,
                    backgroundColor: NEUTRAL.canvas,
                    border: `1px solid ${NEUTRAL.borderStrong}`,
                    borderBottom: 'none',
                    borderRadius: '6px 6px 0 0',
                    color: NEUTRAL.muted,
                  }}
                >
                  {TOOLBAR_ITEMS.map((item, idx) => (
                    <React.Fragment key={item.labelKey}>
                      {idx === 3 && <Box sx={{ width: '1px', height: 16, backgroundColor: NEUTRAL.border }} />}
                      <Tooltip title={t(item.labelKey)}>
                        <Box component="span" sx={{ ...TOOLBAR_ITEM_SX, ...item.sx }}>
                          {item.displayKey ? t(item.displayKey) : item.display}
                        </Box>
                      </Tooltip>
                    </React.Fragment>
                  ))}
                </Box>
                <CommonTextField
                  id="course-introduction"
                  multiline
                  rows={3}
                  value={introduction}
                  onChange={(e) => setIntroduction(e.target.value)}
                  placeholder={t('COURSES.CREATE.INTRODUCTION_PLACEHOLDER')}
                  InputProps={{ sx: { borderRadius: '0 0 6px 6px' } }}
                />
              </Box>

              {/* How it works */}
              <CommonTextField
                id="course-how-it-works"
                label={t('COURSES.CREATE.HOW_IT_WORKS')}
                multiline
                rows={2}
                value={howItWorks}
                onChange={(e) => setHowItWorks(e.target.value)}
                placeholder={t('COURSES.CREATE.HOW_IT_WORKS_PLACEHOLDER')}
              />
            </Box>
          </Paper>

          {/* Card 2: Course Objectives */}
          <Paper elevation={0} sx={CARD_SX}>
            <Box
              sx={{
                ...CARD_HEADER_SX,
                py: 1.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography sx={CARD_TITLE_SX}>{t('COURSES.CREATE.COURSE_OBJECTIVES')}</Typography>
              <CommonButton
                variant="outlined"
                size="small"
                startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                onClick={handleAddObjective}
                sx={{ fontSize: '12px', height: 30, px: 1.5, py: 0 }}
              >
                {t('COURSES.CREATE.ADD_OBJECTIVE')}
              </CommonButton>
            </Box>

            <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {objectives.map((obj, index) => (
                <Box
                  key={obj.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.2,
                  }}
                >
                  {/* Reorder Buttons Up/Down */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <Tooltip title={t('COURSES.MOVE_UP')}>
                      <span>
                        <IconButton
                          size="small"
                          aria-label={t('COURSES.MOVE_UP')}
                          disabled={index === 0}
                          onClick={() => handleMoveObjective(index, 'up')}
                          sx={OBJECTIVE_MOVE_BUTTON_SX}
                        >
                          <KeyboardArrowUpIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={t('COURSES.MOVE_DOWN')}>
                      <span>
                        <IconButton
                          size="small"
                          aria-label={t('COURSES.MOVE_DOWN')}
                          disabled={index === objectives.length - 1}
                          onClick={() => handleMoveObjective(index, 'down')}
                          sx={OBJECTIVE_MOVE_BUTTON_SX}
                        >
                          <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>

                  {/* Objective Input */}
                  <CommonTextField
                    value={obj.text}
                    onChange={(e) => handleUpdateObjective(index, e.target.value)}
                    placeholder={t('COURSES.CREATE.OBJECTIVE_PLACEHOLDER', { number: index + 1 })}
                  />

                  {/* Delete Objective button */}
                  {objectives.length > 1 && (
                    <Tooltip title={t('COURSES.CREATE.REMOVE_OBJECTIVE')}>
                      <IconButton
                        size="small"
                        aria-label={t('COURSES.CREATE.REMOVE_OBJECTIVE')}
                        onClick={() => handleDeleteObjective(index)}
                        sx={{
                          color: NEUTRAL.subtle,
                          '&:hover': { color: '#DC2626', backgroundColor: '#FEE2E2' },
                        }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              ))}

              {/* Bottom hint matching prototype */}
              <Typography variant="caption" sx={{ color: NEUTRAL.subtle, fontSize: '12px', mt: 0.5 }}>
                {t('COURSES.CREATE.MORE_IN_DOCUMENT', { count: 3 })}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Right Column (4 cols): Language + Added after saving */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Card 3: Language */}
            <Paper elevation={0} sx={CARD_SX}>
              <Box
                sx={{
                  ...CARD_HEADER_SX,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography sx={CARD_TITLE_SX}>{t('COMMON.LANGUAGE')} *</Typography>
              </Box>

              <Box sx={{ p: 2.5 }}>
                <CommonRadioGroup
                  name="course-language"
                  row={false}
                  value={language}
                  onChange={setLanguage}
                  options={LANGUAGE_OPTIONS.map((option) => ({
                    value: option.value,
                    label: t(option.labelKey),
                  }))}
                />

                <Typography variant="caption" sx={{ color: NEUTRAL.muted, fontSize: '12px', display: 'block', mt: 1.5 }}>
                  {t('COURSES.CREATE.ONE_LANGUAGE_HINT')}
                </Typography>
              </Box>
            </Paper>

            {/* Card 4: Added after saving */}
            <Paper elevation={0} sx={CARD_SX}>
              <Box sx={CARD_HEADER_SX}>
                <Typography sx={CARD_TITLE_SX}>{t('COURSES.CREATE.ADDED_AFTER_SAVING')}</Typography>
              </Box>

              <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                <Typography sx={{ fontSize: '14px', color: NEUTRAL.ink }}>
                  {t('COURSES.CREATE.SECTIONS_WITH_CONTENT')}
                </Typography>
                <Typography sx={{ fontSize: '14px', color: NEUTRAL.ink }}>
                  {t('COURSES.CREATE.FAQS_SUMMARY_TRANSITION')}
                </Typography>
                <Box>
                  <Box
                    component="span"
                    sx={{
                      backgroundColor: '#E0E7FF',
                      color: '#1E3A8A',
                      fontSize: '13px',
                      fontWeight: 600,
                      px: 0.9,
                      py: 0.3,
                      borderRadius: '4px',
                      display: 'inline-block',
                    }}
                  >
                    {t('COURSES.CREATE.LINKED_COURSE_ASSESSMENT')}
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ color: NEUTRAL.muted, fontSize: '12px', display: 'block', mt: 1 }}>
                  {t('COURSES.CREATE.ALL_APPEAR_IN_EVERY_COURSE')}
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export const getStaticProps = async ({ locale }: { locale: string }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'], nextI18NextConfig as any, ['en', 'mr', 'hi'])),
    },
  };
};
