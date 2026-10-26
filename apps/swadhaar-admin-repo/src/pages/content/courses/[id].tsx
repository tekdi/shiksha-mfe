import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Grid,
  Skeleton,
  Collapse,
  Alert,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../../next-i18next.config.js';
import {
  getCourseHierarchy,
  CourseHierarchy,
  CourseHierarchyChild,
  parseCourseName,
} from '@/services/CourseService';
import LifecycleChip from '@/components/common/LifecycleChip';
import ContentPreviewModal, { PreviewContentData } from '@/components/common/ContentPreviewModal';
import CommonButton from '@/components/common/CommonButton';
import CommonDialog from '@/components/common/CommonDialog';
import CommonTextField from '@/components/common/CommonTextField';
import { BRAND, NEUTRAL } from '@/styles/customTheme';

const CARD_SX = {
  backgroundColor: 'background.paper',
  border: `1px solid ${NEUTRAL.border}`,
  borderRadius: '10px',
  overflow: 'hidden',
};

const BREADCRUMB_LINK_SX = {
  color: NEUTRAL.muted,
  fontSize: '13px',
  fontWeight: 500,
  '&:hover': { color: 'primary.main' },
};

const REORDER_BUTTON_SX = {
  width: 26,
  height: 26,
  borderRadius: '4px',
  border: `1px solid ${NEUTRAL.border}`,
  backgroundColor: 'background.paper',
  color: NEUTRAL.ink,
  '&:hover': { backgroundColor: '#F3F4F6' },
  '&.Mui-disabled': { opacity: 0.4 },
};

const COURSE_ITEM_ROW_SX = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  p: '12px 18px',
};

type Translate = (key: string, options?: Record<string, unknown>) => string;

const SMALL_OUTLINED_BUTTON_SX = { fontSize: '12px', py: 0.5, px: 1.5 };

const getLessonIcon = (format?: string, subFormat?: string | null) => {
  const f = (format || '').toLowerCase();
  const sf = (subFormat || '').toLowerCase();
  if (f === 'video' || sf.includes('youtube')) {
    return <PlayCircleOutlineIcon sx={{ color: 'primary.main', fontSize: 20 }} />;
  }
  if (f === 'document' || sf.includes('pdf')) {
    return <DescriptionOutlinedIcon sx={{ color: '#0284C7', fontSize: 20 }} />;
  }
  if (f === 'test' || sf.includes('quiz') || sf.includes('assessment') || sf.includes('feedback')) {
    return <QuizOutlinedIcon sx={{ color: '#7C3AED', fontSize: 20 }} />;
  }
  return <PlayCircleOutlineIcon sx={{ color: 'primary.main', fontSize: 20 }} />;
};

/** Format label for a lesson row: sub-format, then format, then primary category. */
const getUnitFormatLabel = (unit: CourseHierarchyChild, t: Translate): string => {
  if (unit.subFormat) return unit.subFormat.replace('.', ' ').toUpperCase();
  if (unit.format) return unit.format.toUpperCase();
  return unit.primaryCategory || t('COURSES.DETAIL.LESSON_FALLBACK');
};

/** Summary line under a section name: lesson count and first lesson names, or its description. */
const getSectionSummary = (section: CourseHierarchyChild, t: Translate): string => {
  const childUnits = section.children || [];
  if (childUnits.length > 0) {
    return t('COURSES.DETAIL.SECTION_LESSONS_SUMMARY', {
      count: childUnits.length,
      names: childUnits.slice(0, 3).map((u) => u.name).join(' · '),
    });
  }
  return section.description?.replace(/<[^<>]*>/g, '').trim() || t('COURSES.DETAIL.MODULE_CONTENT');
};

const SECTION_SKELETON_KEYS = ['section-sk-1', 'section-sk-2', 'section-sk-3', 'section-sk-4'];

export default function CourseDetailsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = router.query;
  const courseId = typeof id === 'string' ? id : '';

  const [loading, setLoading] = useState<boolean>(true);
  const [course, setCourse] = useState<CourseHierarchy | null>(null);
  const [sections, setSections] = useState<CourseHierarchyChild[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  // Stores an i18n key so the message re-renders in the active language
  const [errorKey, setErrorKey] = useState<string | null>(null);

  // Edit Course Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editAudience, setEditAudience] = useState('');

  // Native In-App Preview Modal State (No external player/workspace MFE)
  const [previewItem, setPreviewItem] = useState<PreviewContentData | null>(null);

  const fetchHierarchy = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setErrorKey(null);

    // If new course initialized from Create Course page
    if (courseId === 'new' || courseId.startsWith('new')) {
      const title = (router.query.title as string) || 'New Course';
      const audience = (router.query.audience as string) || 'New field trainers and Community Resource Persons';
      setCourse({
        courseId: courseId,
        identifier: courseId,
        title: title,
        name: title,
        status: 'Draft',
        audience: audience,
        leafNodesCount: 0,
        children: [],
      });
      setEditTitle(title);
      setEditAudience(audience);
      setSections([]);
      setLoading(false);
      return;
    }

    try {
      const data = await getCourseHierarchy(courseId);
      setCourse(data);
      setEditTitle(data.title || data.name || '');
      setEditAudience(
        Array.isArray(data.audience)
          ? data.audience.join(', ')
          : data.audience || 'Field trainers and learners'
      );

      // In Aspire LMS, course children are the modules, and module children are lessons
      setSections(data.children || []);
    } catch (err) {
      console.error('Failed to load course hierarchy:', err);
      setErrorKey('COURSES.DETAIL.LOAD_ERROR');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  // Handle section reordering (visual demo)
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;
    setSections(newSections);
  };

  const handleToggleExpand = (sectionId: string) => {
    setExpandedSection((prev) => (prev === sectionId ? null : sectionId));
  };

  const handleSaveEditCourse = () => {
    if (course) {
      setCourse({
        ...course,
        name: editTitle,
        audience: editAudience,
      });
    }
    setIsEditModalOpen(false);
  };

  const handleDeleteSection = (secId: string) => {
    setSections(sections.filter((s) => s.identifier !== secId));
  };

  const parsedName = parseCourseName(course?.name || '');
  const courseCode = parsedName.code || t('COURSES.DEFAULT_COURSE_CODE');
  const cleanTitle = parsedName.title || course?.name || t('COURSES.DEFAULT_COURSE_TITLE');
  const audienceText =
    Array.isArray(course?.audience)
      ? course.audience.join(', ')
      : course?.audience || t('COURSES.DETAIL.DEFAULT_AUDIENCE');
  const languageText = course?.detectedLanguage || (course?.language ? course.language[0] : t('COURSES.LANGUAGE_ENGLISH'));
  const totalLessons = sections.reduce((acc, s) => acc + (s.children?.length || 0), 0);

  const formatMinutes = (minutes?: number | null) =>
    minutes ? t('COURSES.DURATION_MIN', { count: minutes }) : undefined;

  const handlePreviewCourse = () => {
    // Preview first available lesson or course overview
    const firstSection = sections[0];
    const firstLesson = firstSection?.children?.[0];
    if (firstLesson) {
      setPreviewItem({
        name: firstLesson.name,
        type: firstLesson.format || firstLesson.subFormat || 'video',
        description: firstLesson.description || `${cleanTitle} · ${firstSection.name}`,
        duration: formatMinutes(firstLesson.idealTime),
      });
    } else {
      setPreviewItem({
        name: cleanTitle,
        type: 'video',
        description: course?.description || t('COURSES.DETAIL.COURSE_OVERVIEW_PREVIEW'),
      });
    }
  };

  const handleAddSection = () => {
    const basePath = router.asPath.startsWith('/courses') ? '/courses' : '/content/courses';
    router.push(`${basePath}/${courseId}/sections/create`);
  };

  const renderSectionList = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {SECTION_SKELETON_KEYS.map((skeletonKey) => (
            <Skeleton key={skeletonKey} variant="rectangular" height={72} sx={{ borderRadius: '10px' }} />
          ))}
        </Box>
      );
    }

    if (sections.length === 0) {
      return (
        <Paper elevation={0} sx={{ ...CARD_SX, p: 4, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: NEUTRAL.muted }}>
            {t('COURSES.DETAIL.NO_SECTIONS')}
          </Typography>
        </Paper>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {sections.map((section, idx) => {
          const isExpanded = expandedSection === section.identifier;
          const childUnits = section.children || [];

          return (
            <Box
              key={section.identifier}
              sx={{
                display: 'flex',
                gap: 1.5,
                alignItems: 'flex-start',
              }}
            >
              {/* Reorder Buttons (Up & Down) */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pt: 0.8 }}>
                <IconButton
                  size="small"
                  aria-label={t('COURSES.DETAIL.MOVE_SECTION_UP', { position: idx + 1 })}
                  disabled={idx === 0}
                  onClick={() => handleMoveSection(idx, 'up')}
                  sx={REORDER_BUTTON_SX}
                >
                  <KeyboardArrowUpIcon sx={{ fontSize: 16 }} />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label={t('COURSES.DETAIL.MOVE_SECTION_DOWN', { position: idx + 1 })}
                  disabled={idx === sections.length - 1}
                  onClick={() => handleMoveSection(idx, 'down')}
                  sx={REORDER_BUTTON_SX}
                >
                  <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>

              {/* Section Card */}
              <Paper
                elevation={0}
                sx={{
                  ...CARD_SX,
                  flexGrow: 1,
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
                }}
              >
                <Box
                  sx={{
                    p: '14px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 2,
                    cursor: 'pointer',
                  }}
                  onClick={() => handleToggleExpand(section.identifier)}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography sx={{ fontSize: '15px', fontWeight: 600, color: NEUTRAL.ink }}>
                      {section.name}
                    </Typography>
                    <Typography sx={{ fontSize: '13px', color: NEUTRAL.muted }}>
                      {section.duration ? `${t('COURSES.DURATION_MIN', { count: Number(section.duration) })} · ` : ''}
                      {getSectionSummary(section, t)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center' }}>
                    <Chip
                      label={section.status === 'published' || !section.status ? t('COMMON.ACTIVE') : section.status}
                      size="small"
                      sx={{
                        backgroundColor: '#DCFCE7',
                        color: '#15803D',
                        border: '1px solid #86EFAC',
                        fontWeight: 600,
                        fontSize: '11px',
                        height: 22,
                      }}
                    />
                    <Tooltip title={t('COURSES.DETAIL.EDIT_CONTENT')}>
                      <IconButton
                        size="small"
                        aria-label={t('COURSES.DETAIL.EDIT_CONTENT')}
                        onClick={(e) => {
                          e.stopPropagation();
                          alert(t('COURSES.DETAIL.EDITING_CONTENT_FOR', { name: section.name }));
                        }}
                        sx={{
                          color: NEUTRAL.muted,
                          '&:hover': { color: 'primary.main' },
                        }}
                      >
                        <EditOutlinedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('COMMON.DELETE')}>
                      <IconButton
                        size="small"
                        aria-label={t('COMMON.DELETE')}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSection(section.identifier);
                        }}
                        sx={{
                          color: '#BA1A1A',
                          '&:hover': { backgroundColor: '#FEE2E2' },
                        }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <IconButton
                      size="small"
                      aria-label={isExpanded ? t('COURSES.DETAIL.COLLAPSE') : t('COURSES.DETAIL.EXPAND')}
                      sx={{ color: NEUTRAL.subtle }}
                    >
                      {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                </Box>

                {/* Expandable Child Units */}
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <Box sx={{ backgroundColor: '#F9FAFB', borderTop: `1px solid ${NEUTRAL.divider}`, p: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: NEUTRAL.muted,
                        letterSpacing: '0.5px',
                        display: 'block',
                        mb: 1,
                      }}
                    >
                      {t('COURSES.DETAIL.MODULE_LESSONS_HEADING', { count: childUnits.length })}
                    </Typography>
                    {childUnits.length === 0 ? (
                      <Typography variant="body2" sx={{ color: NEUTRAL.subtle, fontSize: '13px' }}>
                        {t('COURSES.DETAIL.NO_LESSONS')}
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {childUnits.map((unit, uIdx) => (
                          <Box
                            key={unit.identifier || uIdx}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              p: 1.2,
                              px: 2,
                              borderRadius: '6px',
                              backgroundColor: 'background.paper',
                              border: '1px solid #E5E7EB',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              {getLessonIcon(unit.format, unit.subFormat)}
                              <Box>
                                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: NEUTRAL.ink }}>
                                  {unit.name}
                                </Typography>
                                <Typography sx={{ fontSize: '11px', color: NEUTRAL.muted }}>
                                  {getUnitFormatLabel(unit, t)}
                                  {unit.idealTime ? ` · ${t('COURSES.DURATION_MIN', { count: unit.idealTime })}` : ''}
                                  {unit.totalMarks
                                    ? ` · ${t('COURSES.DETAIL.MARKS', { passing: unit.passingMarks || 0, total: unit.totalMarks })}`
                                    : ''}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                label={unit.status || t('COMMON.ACTIVE')}
                                size="small"
                                sx={{
                                  backgroundColor: '#F3F4F6',
                                  color: '#4B5563',
                                  fontSize: '10px',
                                  height: 20,
                                }}
                              />
                              <Tooltip title={t('COURSES.DETAIL.PREVIEW_LESSON')}>
                                <IconButton
                                  size="small"
                                  aria-label={t('COURSES.DETAIL.PREVIEW_LESSON')}
                                  onClick={() => {
                                    setPreviewItem({
                                      name: unit.name,
                                      type: unit.format || unit.subFormat || 'video',
                                      description:
                                        unit.description || `${cleanTitle} · ${t('COURSES.DETAIL.LESSON')}`,
                                      duration: formatMinutes(unit.idealTime),
                                      totalMarks: unit.totalMarks,
                                      passingMarks: unit.passingMarks,
                                    });
                                  }}
                                  sx={{
                                    color: NEUTRAL.muted,
                                    width: 28,
                                    height: 28,
                                    '&:hover': {
                                      backgroundColor: BRAND.primarySoft,
                                      color: 'primary.main',
                                    },
                                  }}
                                >
                                  <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </Paper>
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <Box sx={{ py: 1, backgroundColor: NEUTRAL.hover, minHeight: 'calc(100vh - 120px)', m: -2, p: 3 }}>
      {/* Breadcrumb Navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
        <Link href="/content/courses" style={{ textDecoration: 'none' }}>
          <Typography variant="body2" sx={BREADCRUMB_LINK_SX}>
            {t('COURSES.BREADCRUMB_LEARNING')}
          </Typography>
        </Link>
        <Typography variant="body2" sx={{ color: NEUTRAL.subtle, fontSize: '13px' }}>
          /
        </Typography>
        <Link href="/content/courses" style={{ textDecoration: 'none' }}>
          <Typography variant="body2" sx={BREADCRUMB_LINK_SX}>
            {t('COURSES.BREADCRUMB_COURSES')}
          </Typography>
        </Link>
        <Typography variant="body2" sx={{ color: NEUTRAL.subtle, fontSize: '13px' }}>
          /
        </Typography>
        <Typography variant="body2" sx={{ color: NEUTRAL.ink, fontSize: '13px', fontWeight: 600 }}>
          {courseCode} · {cleanTitle}
        </Typography>
      </Box>

      {errorKey && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorKey(null)}>
          {t(errorKey)}
        </Alert>
      )}

      {/* Header Bar */}
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
        <Box sx={{ maxWidth: '70%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap', mb: 0.8 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '26px' }}>
              {loading ? <Skeleton width={320} /> : cleanTitle}
            </Typography>

            {!loading && (
              <>
                <Chip
                  label={courseCode}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontSize: '12px',
                    backgroundColor: 'background.paper',
                    border: `1px solid ${NEUTRAL.border}`,
                    color: NEUTRAL.ink,
                    height: 24,
                  }}
                />
                <LifecycleChip state={course?.status || 'published'} />
              </>
            )}
          </Box>

          <Typography variant="body2" sx={{ color: NEUTRAL.muted, fontSize: '14px' }}>
            {loading ? (
              <Skeleton width={260} />
            ) : (
              t('COURSES.DETAIL.META', {
                audience: audienceText,
                language: languageText,
                count: sections.length,
              })
            )}
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center' }}>
          <CommonButton variant="outlined" onClick={() => setIsEditModalOpen(true)}>
            {t('COURSES.EDIT_DETAILS')}
          </CommonButton>

          <CommonButton
            variant="outlined"
            startIcon={<VisibilityOutlinedIcon fontSize="small" />}
            onClick={handlePreviewCourse}
          >
            {t('COURSES.DETAIL.PREVIEW')}
          </CommonButton>

          <CommonButton variant="primary" onClick={() => alert(t('COURSES.DETAIL.PUBLISH_SUCCESS'))}>
            {t('COURSES.DETAIL.PUBLISH_CHANGES')}
          </CommonButton>
        </Box>
      </Box>

      {/* Main Grid: Left Column 2/3, Right Column 1/3 */}
      <Grid container spacing={3}>
        {/* Left Column (Sections & Course-level items) */}
        <Grid item xs={12} md={8}>
          {/* Sections Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontSize: '17px', fontWeight: 600, color: NEUTRAL.ink }}>
              {t('COURSES.DETAIL.SECTIONS')}
            </Typography>
            <CommonButton variant="outlined" size="small" onClick={handleAddSection} sx={SMALL_OUTLINED_BUTTON_SX}>
              {t('COURSES.DETAIL.ADD_SECTION')}
            </CommonButton>
          </Box>

          {/* Section List */}
          {renderSectionList()}

          {/* Course-level items */}
          <Box sx={{ mt: 3.5, mb: 1.5 }}>
            <Typography variant="h6" sx={{ fontSize: '17px', fontWeight: 600, color: NEUTRAL.ink }}>
              {t('COURSES.DETAIL.COURSE_LEVEL_ITEMS')}
            </Typography>
          </Box>

          <Paper elevation={0} sx={CARD_SX}>
            {/* FAQs */}
            <Box sx={{ ...COURSE_ITEM_ROW_SX, borderBottom: `1px solid ${NEUTRAL.divider}` }}>
              <Typography sx={{ fontSize: '14px', color: NEUTRAL.ink }}>
                <strong style={{ fontWeight: 600 }}>{t('COURSES.DETAIL.FAQS')}</strong>{' '}
                <span style={{ color: NEUTRAL.muted }}>· {t('COURSES.DETAIL.FAQS_COUNT', { count: 10 })}</span>
              </Typography>
              <Tooltip title={t('COURSES.DETAIL.EDIT_FAQS')}>
                <IconButton size="small" aria-label={t('COURSES.DETAIL.EDIT_FAQS')} sx={{ color: NEUTRAL.muted }}>
                  <EditOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Summary */}
            <Box sx={{ ...COURSE_ITEM_ROW_SX, borderBottom: `1px solid ${NEUTRAL.divider}` }}>
              <Typography sx={{ fontSize: '14px', color: NEUTRAL.ink }}>
                <strong style={{ fontWeight: 600 }}>{t('COURSES.DETAIL.SUMMARY')}</strong>
              </Typography>
              <Tooltip title={t('COURSES.DETAIL.EDIT_SUMMARY')}>
                <IconButton size="small" aria-label={t('COURSES.DETAIL.EDIT_SUMMARY')} sx={{ color: NEUTRAL.muted }}>
                  <EditOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Assessment */}
            <Box sx={{ ...COURSE_ITEM_ROW_SX, borderBottom: `1px solid ${NEUTRAL.divider}` }}>
              <Typography sx={{ fontSize: '14px', color: NEUTRAL.ink, display: 'flex', alignItems: 'center', gap: 1 }}>
                <strong style={{ fontWeight: 600 }}>{t('COURSES.DETAIL.ASSESSMENT')}</strong>
                <span style={{ color: NEUTRAL.muted }}>· {t('COURSES.DETAIL.ASSESSMENT_INFO')}</span>
              </Typography>
              <CommonButton
                variant="outlined"
                size="small"
                sx={{ ...SMALL_OUTLINED_BUTTON_SX, py: 0.4 }}
                onClick={() => router.push('/content?tab=assessments')}
              >
                {t('COURSES.DETAIL.OPEN_IN_ASSESSMENTS')}
              </CommonButton>
            </Box>

            {/* Transition */}
            <Box sx={COURSE_ITEM_ROW_SX}>
              <Typography sx={{ fontSize: '14px', color: NEUTRAL.ink }}>
                <strong style={{ fontWeight: 600 }}>{t('COURSES.DETAIL.TRANSITION')}</strong>{' '}
                <span style={{ color: NEUTRAL.muted }}>· {t('COURSES.DETAIL.TRANSITION_INFO')}</span>
              </Typography>
              <Tooltip title={t('COURSES.DETAIL.EDIT_TRANSITION')}>
                <IconButton size="small" aria-label={t('COURSES.DETAIL.EDIT_TRANSITION')} sx={{ color: NEUTRAL.muted }}>
                  <EditOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
        </Grid>

        {/* Right Column (Publishing & Used in learning paths) */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Publishing Card */}
            <Paper elevation={0} sx={CARD_SX}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: '14px 20px',
                  borderBottom: `1px solid ${NEUTRAL.divider}`,
                }}
              >
                <Typography sx={{ fontSize: '15px', fontWeight: 600, color: NEUTRAL.ink }}>
                  {t('COURSES.DETAIL.PUBLISHING')}
                </Typography>
              </Box>

              <Box sx={{ p: '16px 20px', display: 'flex', flexDirection: 'column', gap: 1.5, fontSize: '14px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: NEUTRAL.muted }}>
                    {t('COMMON.STATUS')}
                  </Typography>
                  <LifecycleChip state={course?.status || 'published'} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: NEUTRAL.muted }}>
                    {t('COURSES.DETAIL.MODULES')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: NEUTRAL.ink }}>
                    {t('COURSES.MODULES_COUNT', { count: sections.length })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: NEUTRAL.muted }}>
                    {t('COURSES.DETAIL.TOTAL_LESSONS')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: NEUTRAL.ink }}>
                    {t('COURSES.DETAIL.LESSONS_COUNT', { count: totalLessons })}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Used in learning paths Card */}
            <Paper elevation={0} sx={CARD_SX}>
              <Box sx={{ p: '14px 20px', borderBottom: `1px solid ${NEUTRAL.divider}` }}>
                <Typography sx={{ fontSize: '15px', fontWeight: 600, color: NEUTRAL.ink }}>
                  {t('COURSES.DETAIL.USED_IN_LEARNING_PATHS')}
                </Typography>
              </Box>

              <Box sx={{ p: '16px 20px', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: NEUTRAL.ink,
                    cursor: 'pointer',
                    '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                  }}
                  onClick={() => router.push('/learning-paths/financial-inclusion-training-programme')}
                >
                  {t('COURSES.PROGRAMME_NAME')}
                </Typography>
                <Typography variant="caption" sx={{ color: NEUTRAL.muted }}>
                  {t('COURSES.DETAIL.STEP_OF', { step: 2, total: 7 })}
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>

      {/* Edit Details Dialog */}
      <CommonDialog
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t('COURSES.DETAIL.EDIT_DIALOG_TITLE')}
        onConfirm={handleSaveEditCourse}
        confirmLabel={t('COMMON.SAVE_CHANGES')}
        maxWidth="sm"
        paperMaxWidth="600px"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <CommonTextField
            id="edit-course-name"
            label={t('COURSES.DETAIL.COURSE_NAME')}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <CommonTextField
            id="edit-course-audience"
            label={t('COURSES.DETAIL.TARGET_AUDIENCE')}
            value={editAudience}
            onChange={(e) => setEditAudience(e.target.value)}
          />
        </Box>
      </CommonDialog>

      {/* Native In-App Content Preview Modal (No MFE required) */}
      <ContentPreviewModal
        open={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        content={previewItem}
      />
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

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
});
