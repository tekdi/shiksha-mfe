import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Autocomplete, Box, CircularProgress, Paper, TextField, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import CommonButton from '@/components/common/CommonButton';
import CommonDialog from '@/components/common/CommonDialog';
import CommonTextField from '@/components/common/CommonTextField';
import LifecycleChip from '@/components/common/LifecycleChip';
import {
  COURSE_LANGUAGE_OPTIONS,
  CourseItem,
  CourseLanguageCode,
  CourseTranslation,
  courseLanguageLabelKey,
  createCourseTranslation,
  getCourseList,
  getCourseTranslations,
  linkCourseTranslation,
} from '@/services/CourseService';
import { NEUTRAL } from '@/styles/customTheme';

const CARD_SX = {
  backgroundColor: 'background.paper',
  border: `1px solid ${NEUTRAL.border}`,
  borderRadius: '10px',
  overflow: 'hidden',
};

/** The reason the LMS gave for a failed call (e.g. 409: that language already has a version) */
const apiReason = (err: any): string =>
  err?.response?.data?.params?.errmsg || err?.response?.data?.message || err?.message || '';

export interface CourseVersionsCardProps {
  courseId: string;
  courseTitle: string;
  onMessage: (severity: 'success' | 'error', message: string) => void;
}

/**
 * Task 36: the English / Hindi / Marathi versions of a course. Each language shows its version (linked to
 * its page), or lets the admin copy this course as that language's version or link an existing course.
 */
const CourseVersionsCard: React.FC<CourseVersionsCardProps> = ({ courseId, courseTitle, onMessage }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [versions, setVersions] = useState<CourseTranslation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  // Create: copy this course as a version in `createLanguage`
  const [createLanguage, setCreateLanguage] = useState<CourseLanguageCode | null>(null);
  const [createTitle, setCreateTitle] = useState('');
  const [creating, setCreating] = useState(false);

  // Link: an existing course in `linkLanguage` joins this course's versions
  const [linkLanguage, setLinkLanguage] = useState<CourseLanguageCode | null>(null);
  const [linkOptions, setLinkOptions] = useState<CourseItem[]>([]);
  const [linkOptionsLoading, setLinkOptionsLoading] = useState(false);
  const [linkChoice, setLinkChoice] = useState<CourseItem | null>(null);
  const [linking, setLinking] = useState(false);

  // Unlink: a version leaves the group
  const [unlinkTarget, setUnlinkTarget] = useState<CourseTranslation | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  const loadVersions = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setLoadFailed(false);
    try {
      setVersions(await getCourseTranslations(courseId));
    } catch (err) {
      console.error('Failed to load the language versions:', err);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const byLanguage = useMemo(() => {
    const map = new Map<CourseLanguageCode, CourseTranslation>();
    versions.forEach((v) => map.set(v.language, v));
    return map;
  }, [versions]);

  const languageName = (code: CourseLanguageCode) => t(courseLanguageLabelKey(code));

  const openCreate = (code: CourseLanguageCode) => {
    setCreateTitle(courseTitle);
    setCreateLanguage(code);
  };

  const handleCreate = async () => {
    if (!createLanguage) return;
    setCreating(true);
    try {
      const created = await createCourseTranslation(courseId, createLanguage, createTitle);
      onMessage('success', t('COURSES.VERSIONS.CREATED', { language: languageName(createLanguage) }));
      setCreateLanguage(null);
      if (created?.courseId) {
        router.push(`/content/courses/${created.courseId}`);
      } else {
        loadVersions();
      }
    } catch (err) {
      onMessage('error', t('COURSES.VERSIONS.CREATE_FAILED', { reason: apiReason(err) }));
    } finally {
      setCreating(false);
    }
  };

  const openLink = async (code: CourseLanguageCode) => {
    setLinkLanguage(code);
    setLinkChoice(null);
    setLinkOptions([]);
    setLinkOptionsLoading(true);
    try {
      const res = await getCourseList({ language: [code], limit: 100, offset: 0, sortBy: 'title', orderBy: 'ASC' });
      // Courses already among these versions are not offered
      const inGroup = new Set(versions.map((v) => v.courseId));
      setLinkOptions((res.content || []).filter((c) => !inGroup.has(c.courseId)));
    } finally {
      setLinkOptionsLoading(false);
    }
  };

  const handleLink = async () => {
    if (!linkLanguage || !linkChoice) return;
    setLinking(true);
    try {
      // The chosen course joins this course's group
      await linkCourseTranslation(linkChoice.courseId, courseId);
      onMessage('success', t('COURSES.VERSIONS.LINKED', { language: languageName(linkLanguage) }));
      setLinkLanguage(null);
      loadVersions();
    } catch (err) {
      onMessage('error', t('COURSES.VERSIONS.LINK_FAILED', { reason: apiReason(err) }));
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async () => {
    if (!unlinkTarget) return;
    setUnlinking(true);
    try {
      await linkCourseTranslation(unlinkTarget.courseId, null);
      onMessage('success', t('COURSES.VERSIONS.UNLINKED', { title: unlinkTarget.title }));
      setUnlinkTarget(null);
      loadVersions();
    } catch (err) {
      onMessage('error', t('COURSES.VERSIONS.UNLINK_FAILED', { reason: apiReason(err) }));
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <Paper elevation={0} sx={CARD_SX}>
      <Box sx={{ p: '14px 20px', borderBottom: `1px solid ${NEUTRAL.divider}` }}>
        <Typography sx={{ fontSize: '15px', fontWeight: 600, color: NEUTRAL.ink }}>
          {t('COURSES.VERSIONS.TITLE')}
        </Typography>
        <Typography variant="caption" sx={{ color: NEUTRAL.muted }}>
          {t('COURSES.VERSIONS.SUBTITLE')}
        </Typography>
      </Box>

      <Box sx={{ p: '12px 20px', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <CircularProgress size={20} />
          </Box>
        )}
        {!loading && loadFailed && (
          <Typography variant="body2" sx={{ color: NEUTRAL.muted }}>
            {t('COURSES.VERSIONS.LOAD_FAILED')}
          </Typography>
        )}
        {!loading &&
          !loadFailed &&
          COURSE_LANGUAGE_OPTIONS.map(({ code }) => {
            const version = byLanguage.get(code);
            const isThisCourse = version?.courseId === courseId;
            return (
              <Box
                key={code}
                sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pb: 1.5, borderBottom: `1px solid ${NEUTRAL.divider}` }}
              >
                <Typography sx={{ fontSize: '12px', fontWeight: 600, color: NEUTRAL.muted, textTransform: 'uppercase' }}>
                  {languageName(code)}
                </Typography>
                {version ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: NEUTRAL.ink,
                          cursor: isThisCourse ? 'default' : 'pointer',
                          '&:hover': isThisCourse ? {} : { color: 'primary.main', textDecoration: 'underline' },
                        }}
                        onClick={() => !isThisCourse && router.push(`/content/courses/${version.courseId}`)}
                      >
                        {version.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <LifecycleChip state={version.status} />
                        {isThisCourse && (
                          <Typography variant="caption" sx={{ color: NEUTRAL.muted }}>
                            {t('COURSES.VERSIONS.THIS_COURSE')}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    {versions.length > 1 && (
                      <CommonButton variant="text" size="small" onClick={() => setUnlinkTarget(version)}>
                        {t('COURSES.VERSIONS.UNLINK')}
                      </CommonButton>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <CommonButton variant="outlined" size="small" onClick={() => openCreate(code)}>
                      {t('COURSES.VERSIONS.CREATE', { language: languageName(code) })}
                    </CommonButton>
                    <CommonButton variant="text" size="small" onClick={() => openLink(code)}>
                      {t('COURSES.VERSIONS.LINK_EXISTING')}
                    </CommonButton>
                  </Box>
                )}
              </Box>
            );
          })}
      </Box>

      {/* Create a version: copies this course's sections and lessons */}
      <CommonDialog
        open={Boolean(createLanguage)}
        onClose={() => !creating && setCreateLanguage(null)}
        title={createLanguage ? t('COURSES.VERSIONS.CREATE', { language: languageName(createLanguage) }) : ''}
        onConfirm={handleCreate}
        confirmLabel={t('COURSES.VERSIONS.CREATE_CONFIRM')}
        confirmDisabled={!createTitle.trim()}
        loading={creating}
        maxWidth="sm"
      >
        <Typography variant="body2" sx={{ color: NEUTRAL.muted, mb: 2 }}>
          {createLanguage && t('COURSES.VERSIONS.CREATE_NOTE', { language: languageName(createLanguage) })}
        </Typography>
        <CommonTextField
          label={t('COURSES.VERSIONS.VERSION_TITLE')}
          value={createTitle}
          onChange={(e) => setCreateTitle(e.target.value)}
          fullWidth
        />
      </CommonDialog>

      {/* Link an existing course in that language */}
      <CommonDialog
        open={Boolean(linkLanguage)}
        onClose={() => !linking && setLinkLanguage(null)}
        title={linkLanguage ? t('COURSES.VERSIONS.LINK_TITLE', { language: languageName(linkLanguage) }) : ''}
        onConfirm={handleLink}
        confirmLabel={t('COURSES.VERSIONS.LINK_CONFIRM')}
        confirmDisabled={!linkChoice}
        loading={linking}
        maxWidth="sm"
      >
        <Typography variant="body2" sx={{ color: NEUTRAL.muted, mb: 2 }}>
          {linkLanguage && t('COURSES.VERSIONS.LINK_NOTE', { language: languageName(linkLanguage) })}
        </Typography>
        <Autocomplete
          size="small"
          options={linkOptions}
          loading={linkOptionsLoading}
          value={linkChoice}
          onChange={(_, value) => setLinkChoice(value)}
          getOptionLabel={(option) => option.title || ''}
          isOptionEqualToValue={(option, value) => option.courseId === value.courseId}
          noOptionsText={t('COURSES.VERSIONS.NO_COURSES')}
          renderInput={(params) => <TextField {...params} placeholder={t('COURSES.VERSIONS.PICK_COURSE')} />}
        />
      </CommonDialog>

      {/* Unlink a version */}
      <CommonDialog
        open={Boolean(unlinkTarget)}
        onClose={() => !unlinking && setUnlinkTarget(null)}
        title={t('COURSES.VERSIONS.UNLINK_TITLE')}
        onConfirm={handleUnlink}
        confirmLabel={t('COURSES.VERSIONS.UNLINK')}
        loading={unlinking}
        maxWidth="xs"
      >
        <Typography variant="body2">
          {unlinkTarget && t('COURSES.VERSIONS.UNLINK_BODY', { title: unlinkTarget.title })}
        </Typography>
      </CommonDialog>
    </Paper>
  );
};

export default CourseVersionsCard;
