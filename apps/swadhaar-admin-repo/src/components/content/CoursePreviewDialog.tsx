import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, Collapse, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import { useTranslation } from 'next-i18next';
import ContentPreviewModal, { PreviewContentData } from '@/components/common/ContentPreviewModal';
import { CourseHierarchyChild } from '@/services/CourseService';
import { BRAND, NEUTRAL } from '@/styles/customTheme';

/**
 * Preview data for one LMS lesson: video / document URL from media.source, a test's id from
 * media.source, a text lesson's body from its description (HTML).
 */
export const toLessonPreview = (unit: CourseHierarchyChild, subtitle: string, duration?: string): PreviewContentData => {
  const format = String(unit.format || '').toLowerCase();
  const source: string | undefined = unit.media?.source || undefined;
  const isText = format.includes('text') || String(unit.subFormat || '').toLowerCase().startsWith('text');
  return {
    identifier: unit.lessonId || unit.identifier,
    name: unit.name,
    type: unit.format || unit.subFormat || 'video',
    subType: unit.subFormat || undefined,
    description: isText ? subtitle : unit.description || subtitle,
    html: isText ? unit.description || '' : undefined,
    artifactUrl: format === 'test' || isText ? undefined : source,
    duration,
    totalMarks: unit.totalMarks,
    passingMarks: unit.passingMarks,
    testId: format === 'test' ? source : undefined,
  };
};

const lessonIcon = (unit: CourseHierarchyChild) => {
  const format = String(unit.format || '').toLowerCase();
  const sx = { fontSize: 18, color: BRAND.primary };
  if (format === 'video') return <PlayCircleOutlineIcon sx={sx} />;
  if (format === 'document' || format === 'pdf') return <PictureAsPdfOutlinedIcon sx={sx} />;
  if (format === 'test') return <QuizOutlinedIcon sx={sx} />;
  return <ArticleOutlinedIcon sx={sx} />;
};

const isPublished = (status?: string) => !status || String(status).toLowerCase() === 'published';

const plainText = (html?: string) =>
  (html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

interface FlatLesson {
  unit: CourseHierarchyChild;
  sectionIndex: number;
  sectionName: string;
}

interface CoursePreviewDialogProps {
  onClose: () => void;
  title: string;
  description?: string;
  image?: string;
  languageLabel?: string;
  audienceLabel?: string;
  sections: CourseHierarchyChild[];
  /** Formats a duration in minutes, e.g. "12 min" */
  formatMinutes: (minutes?: number | null) => string | undefined;
}

/**
 * Task 36a: the course as a learner meets it, shown inline on its own page (inside the admin layout). A section → lesson tree on the left; the course overview
 * and the chosen lesson on the right. Lessons open in ContentPreviewModal with Previous / Next through
 * every lesson of the course, in course order. Read-only.
 */
const CoursePreviewDialog: React.FC<CoursePreviewDialogProps> = ({
  onClose,
  title,
  description,
  image,
  languageLabel,
  audienceLabel,
  sections,
  formatMinutes,
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);

  const lessons: FlatLesson[] = useMemo(
    () =>
      sections.flatMap((section, sectionIndex) =>
        (section.children || []).map((unit) => ({ unit, sectionIndex, sectionName: section.name }))
      ),
    [sections]
  );
  const totalMinutes = lessons.reduce((sum, l) => sum + (Number(l.unit.idealTime) || 0), 0);

  // Every section open on each new preview; nothing chosen yet
  useEffect(() => {
    setExpanded(Object.fromEntries(sections.map((_, i) => [i, true])));
    setSelected(null);
    setPlaying(null);
  }, [sections]);

  const indexOf = (unit: CourseHierarchyChild) => lessons.findIndex((l) => l.unit === unit);
  const selectedLesson = selected !== null ? lessons[selected] : null;
  const playingLesson = playing !== null ? lessons[playing] : null;

  const play = (index: number) => {
    setSelected(index);
    setPlaying(index);
    setExpanded((prev) => ({ ...prev, [lessons[index].sectionIndex]: true }));
  };

  const previewFor = (l: FlatLesson) =>
    toLessonPreview(l.unit, `${title} · ${l.sectionName}`, formatMinutes(l.unit.idealTime));

  const navFooter =
    playing !== null ? (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          size="small"
          startIcon={<ChevronLeftIcon />}
          disabled={playing === 0}
          onClick={() => play(playing - 1)}
          sx={{ textTransform: 'none' }}
        >
          {t('COMMON.PREVIOUS')}
        </Button>
        <Typography sx={{ fontSize: 12, color: NEUTRAL.muted }}>
          {t('COURSES.PREVIEW.LESSON_OF', { current: playing + 1, total: lessons.length })}
        </Typography>
        <Button
          size="small"
          endIcon={<ChevronRightIcon />}
          disabled={playing >= lessons.length - 1}
          onClick={() => play(playing + 1)}
          sx={{ textTransform: 'none' }}
        >
          {t('COMMON.NEXT')}
        </Button>
      </Box>
    ) : null;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100vh - 160px)',
        border: `1px solid ${NEUTRAL.divider}`,
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      {/* Course header */}
      <Box
        sx={{
          backgroundColor: 'secondary.main',
          color: '#FFFFFF',
          px: { xs: 2, md: 4 },
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 12, color: '#B0B8C4', mb: 0.5 }}>{t('COURSES.PREVIEW.HEADING')}</Typography>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF' }} noWrap>
            {title}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {languageLabel && <Chip size="small" label={languageLabel} sx={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' }} />}
            {audienceLabel && <Chip size="small" label={audienceLabel} sx={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' }} />}
            <Chip
              size="small"
              label={t('COURSES.PREVIEW.COUNTS', { sections: sections.length, lessons: lessons.length })}
              sx={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' }}
            />
            {totalMinutes > 0 && (
              <Chip size="small" label={formatMinutes(totalMinutes)} sx={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' }} />
            )}
          </Box>
        </Box>
        <IconButton onClick={onClose} aria-label={t('COMMON.CLOSE')} sx={{ color: '#FFFFFF' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, flex: 1, minHeight: 0, backgroundColor: NEUTRAL.canvas }}>
        {/* Outline tree */}
        <Box
          sx={{
            width: { xs: '100%', md: 360 },
            flexShrink: 0,
            borderRight: { md: `1px solid ${NEUTRAL.divider}` },
            backgroundColor: 'background.paper',
            overflowY: 'auto',
          }}
        >
          <Typography sx={{ px: 2.5, pt: 2, pb: 1, fontSize: 12, fontWeight: 700, color: NEUTRAL.muted, textTransform: 'uppercase' }}>
            {t('COURSES.PREVIEW.OUTLINE')}
          </Typography>
          {sections.length === 0 && (
            <Typography sx={{ px: 2.5, py: 2, fontSize: 13, color: NEUTRAL.muted }}>{t('COURSES.DETAIL.NO_SECTIONS')}</Typography>
          )}
          {sections.map((section, sectionIndex) => {
            const open_ = expanded[sectionIndex] ?? true;
            const units = section.children || [];
            return (
              <Box key={section.identifier || sectionIndex}>
                <Box
                  role="button"
                  onClick={() => setExpanded((prev) => ({ ...prev, [sectionIndex]: !open_ }))}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1.25,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: NEUTRAL.canvas },
                  }}
                >
                  {open_ ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                  <FolderOutlinedIcon sx={{ fontSize: 18, color: NEUTRAL.muted }} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 600 }} noWrap>
                      {sectionIndex + 1}. {section.name}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: NEUTRAL.muted }}>
                      {t('COURSES.DETAIL.LESSONS_COUNT', { count: units.length })}
                    </Typography>
                  </Box>
                </Box>
                <Collapse in={open_}>
                  {units.length === 0 && (
                    <Typography sx={{ pl: 7, py: 1, fontSize: 12, color: NEUTRAL.muted }}>{t('COURSES.DETAIL.NO_LESSONS')}</Typography>
                  )}
                  {units.map((unit) => {
                    const index = indexOf(unit);
                    const active = index === selected;
                    return (
                      <Box
                        key={unit.lessonId || unit.identifier || index}
                        role="button"
                        onClick={() => setSelected(index)}
                        onDoubleClick={() => play(index)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          pl: 6,
                          pr: 2,
                          py: 1,
                          cursor: 'pointer',
                          borderLeft: `3px solid ${active ? BRAND.primary : 'transparent'}`,
                          backgroundColor: active ? 'rgba(230,135,60,0.08)' : 'transparent',
                          '&:hover': { backgroundColor: active ? 'rgba(230,135,60,0.12)' : NEUTRAL.canvas },
                        }}
                      >
                        {lessonIcon(unit)}
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography sx={{ fontSize: 13 }} noWrap>
                            {unit.name}
                          </Typography>
                          <Typography sx={{ fontSize: 11, color: NEUTRAL.muted }}>
                            {[String(unit.subFormat || unit.format || '').replace(/[._]/g, ' '), formatMinutes(unit.idealTime)]
                              .filter(Boolean)
                              .join(' · ')}
                          </Typography>
                        </Box>
                        {!isPublished(unit.status) && (
                          <Chip size="small" label={t('COURSES.PREVIEW.UNPUBLISHED')} sx={{ height: 20, fontSize: 10 }} />
                        )}
                      </Box>
                    );
                  })}
                </Collapse>
              </Box>
            );
          })}
        </Box>

        {/* Overview and the chosen lesson */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, md: 4 } }}>
          <Box sx={{ maxWidth: 820, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ backgroundColor: 'background.paper', border: `1px solid ${NEUTRAL.divider}`, borderRadius: '10px', overflow: 'hidden' }}>
              {image && (
                <Box component="img" src={image} alt="" sx={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
              )}
              <Box sx={{ p: 3 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: NEUTRAL.muted, textTransform: 'uppercase', mb: 1 }}>
                  {t('COURSES.PREVIEW.OVERVIEW')}
                </Typography>
                <Typography sx={{ fontSize: 14, color: 'text.primary', whiteSpace: 'pre-line' }}>
                  {plainText(description) || t('COURSES.DETAIL.COURSE_OVERVIEW_PREVIEW')}
                </Typography>
                {lessons.length > 0 && (
                  <Button variant="contained" sx={{ mt: 2.5, textTransform: 'none' }} onClick={() => play(selected ?? 0)}>
                    {selected !== null ? t('COURSES.PREVIEW.OPEN_LESSON') : t('COURSES.PREVIEW.START')}
                  </Button>
                )}
              </Box>
            </Box>

            <Box sx={{ backgroundColor: 'background.paper', border: `1px solid ${NEUTRAL.divider}`, borderRadius: '10px', p: 3 }}>
              {selectedLesson ? (
                <>
                  <Typography sx={{ fontSize: 12, color: NEUTRAL.muted, mb: 0.5 }}>
                    {selectedLesson.sectionIndex + 1}. {selectedLesson.sectionName} ·{' '}
                    {t('COURSES.PREVIEW.LESSON_OF', { current: (selected ?? 0) + 1, total: lessons.length })}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {lessonIcon(selectedLesson.unit)}
                    <Typography sx={{ fontSize: 17, fontWeight: 600 }}>{selectedLesson.unit.name}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 13, color: NEUTRAL.muted, mb: 2 }}>
                    {plainText(selectedLesson.unit.description).slice(0, 280) || t('COURSES.PREVIEW.NO_DESCRIPTION')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button variant="contained" sx={{ textTransform: 'none' }} onClick={() => play(selected ?? 0)}>
                      {t('COURSES.PREVIEW.OPEN_LESSON')}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ChevronLeftIcon />}
                      disabled={!selected}
                      onClick={() => setSelected((selected ?? 0) - 1)}
                      sx={{ textTransform: 'none' }}
                    >
                      {t('COMMON.PREVIOUS')}
                    </Button>
                    <Button
                      variant="outlined"
                      endIcon={<ChevronRightIcon />}
                      disabled={selected === null || selected >= lessons.length - 1}
                      onClick={() => setSelected((selected ?? 0) + 1)}
                      sx={{ textTransform: 'none' }}
                    >
                      {t('COMMON.NEXT')}
                    </Button>
                  </Box>
                </>
              ) : (
                <Typography sx={{ fontSize: 13, color: NEUTRAL.muted }}>
                  {lessons.length > 0 ? t('COURSES.PREVIEW.SELECT_LESSON') : t('COURSES.DETAIL.NO_LESSONS')}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* The lesson itself, with Previous / Next through the course */}
      <ContentPreviewModal
        key={playing ?? 'none'}
        open={playingLesson !== null}
        onClose={() => setPlaying(null)}
        content={playingLesson ? previewFor(playingLesson) : null}
        footerStart={navFooter}
      />
    </Box>
  );
};

export default CoursePreviewDialog;
