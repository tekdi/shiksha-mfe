import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, IconButton, Tooltip, Alert } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';
import SwadhaarDataTable, { ColumnDef } from '@/components/common/SwadhaarDataTable';
import CommonButton from '@/components/common/CommonButton';
import PageHeader from '@/components/common/PageHeader';
import { getPathwayList } from '@/services/PathwayService';
import { getCourseList } from '@/services/CourseService';
import EnrolLearningPathModal from '@/components/common/EnrolLearningPathModal';
import { BRAND, NEUTRAL } from '@/styles/customTheme';

export interface LearningPathItem {
  id: string;
  name: string;
  /** Subtitle under the name, e.g. "Courses 0 → 6" */
  codeRange?: string;
  steps: string;
  enrolled: string;
  startDate: string;
  endDate: string;
  certificate: string;
  coursesCount?: number;
}

const NO_VALUE = '—';

const builderHref = (id: string) => `/learning-paths/builder?id=${id}`;

const actionButtonSx = {
  color: 'text.primary',
  border: `1px solid ${NEUTRAL.border}`,
  borderRadius: '6px',
  width: 32,
  height: 32,
  '&:hover': {
    backgroundColor: BRAND.primarySoft,
    borderColor: 'primary.main',
    color: 'primary.main',
  },
};

const cellTextSx = { color: 'text.primary', fontSize: '13px' };

export default function LearningPathsListPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [learningPaths, setLearningPaths] = useState<LearningPathItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Enrol modal state
  const [isEnrolModalOpen, setIsEnrolModalOpen] = useState<boolean>(false);
  const [activePath, setActivePath] = useState<{ id: string; name: string } | null>(null);

  // POST /user/v1/pathway/list
  const fetchLearningPaths = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ pathways }, { content: courses }] = await Promise.all([
        getPathwayList({ isActive: true, limit: 50, offset: 0, filters: {} }),
        getCourseList({ limit: 100 }),
      ]);
      // A course belongs to a path through its params.pathwayId (the pathway's own total_items counts videos/resources)
      const courseCounts = new Map<string, number>();
      const cohortIds = new Map<string, Set<string>>();
      courses.forEach((course) => {
        const pathwayId = course.params?.pathwayId;
        if (!pathwayId) return;
        courseCounts.set(pathwayId, (courseCounts.get(pathwayId) || 0) + 1);
        const enrolled = cohortIds.get(pathwayId) || new Set<string>();
        (course.params?.enrolledCohortIds || []).forEach((id: string) => enrolled.add(id));
        cohortIds.set(pathwayId, enrolled);
      });
      setLearningPaths(
        pathways.map((p) => {
          const count = courseCounts.get(p.id) || 0;
          return {
            id: p.id,
            name: p.name,
            codeRange: count > 0 ? t('LEARNING_PATHS.COURSES_RANGE', { from: 0, to: count - 1 }) : p.key,
            steps: t('LEARNING_PATHS.STEPS_COURSES_ASSESSMENTS', { n: count }),
            coursesCount: count,
            enrolled: cohortIds.get(p.id)?.size ? `${cohortIds.get(p.id)?.size} cohorts` : NO_VALUE,
            startDate: NO_VALUE,
            endDate: NO_VALUE,
            certificate: NO_VALUE,
          };
        })
      );
    } catch (err) {
      console.error('Error fetching learning paths:', err);
      setError(t('LEARNING_PATHS.LOAD_ERROR') || 'Failed to load learning paths.');
      setLearningPaths([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchLearningPaths();
  }, [fetchLearningPaths]);

  const handleOpenEnrol = (path: LearningPathItem) => {
    setActivePath({ id: path.id, name: path.name });
    setIsEnrolModalOpen(true);
  };

  const handleEnrolSuccess = (count: number, type: 'groups' | 'users') => {
    if (type === 'groups') {
      // The saved list of enrolled groups is the source for the column
      fetchLearningPaths();
      return;
    }
    const enrolled = `${count} individual users`;
    setLearningPaths((prev) =>
      prev.map((item) => (item.id === activePath?.id ? { ...item, enrolled } : item))
    );
  };

  const columns: ColumnDef<LearningPathItem>[] = useMemo(
    () => [
      {
        id: 'name',
        label: t('LEARNING_PATHS.COL_LEARNING_PATH'),
        labelKey: 'LEARNING_PATHS.COL_LEARNING_PATH',
        sortable: true,
        minWidth: 320,
        render: (row) => (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
            <Link href={builderHref(row.id)} style={{ textDecoration: 'none' }}>
              <Typography
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                  '&:hover': {
                    color: 'primary.main',
                    textDecoration: 'underline',
                  },
                }}
              >
                {row.name}
              </Typography>
            </Link>
            {row.codeRange && (
              <Typography variant="caption" sx={{ color: NEUTRAL.muted, fontSize: '12px' }}>
                {row.codeRange}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        id: 'steps',
        label: t('LEARNING_PATHS.COL_STEPS'),
        labelKey: 'LEARNING_PATHS.COL_STEPS',
        minWidth: 180,
        render: (row) => (
          <Typography variant="body2" sx={cellTextSx}>
            {row.steps}
          </Typography>
        ),
      },
      {
        id: 'enrolled',
        label: t('LEARNING_PATHS.COL_ENROLLED'),
        labelKey: 'LEARNING_PATHS.COL_ENROLLED',
        minWidth: 160,
        render: (row) => (
          <Typography variant="body2" sx={cellTextSx}>
            {row.enrolled}
          </Typography>
        ),
      },
      // {
      //   id: 'dates',
      //   label: t('LEARNING_PATHS.COL_START_END'),
      //   labelKey: 'LEARNING_PATHS.COL_START_END',
      //   minWidth: 160,
      //   render: (row) => (
      //     <Typography variant="body2" sx={{ color: NEUTRAL.muted, fontSize: '13px' }}>
      //       {row.startDate} – {row.endDate}
      //     </Typography>
      //   ),
      // },
      {
        id: 'certificate',
        label: t('LEARNING_PATHS.COL_CERTIFICATE'),
        labelKey: 'LEARNING_PATHS.COL_CERTIFICATE',
        minWidth: 130,
        render: (row) => (
          <Typography variant="body2" sx={cellTextSx}>
            {row.certificate}
          </Typography>
        ),
      },
      {
        id: 'actions',
        label: t('COMMON.ACTIONS'),
        labelKey: 'COMMON.ACTIONS',
        align: 'right',
        minWidth: 140,
        render: (row) => (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 0.8 }}>
            {/* Right Arrow: Open Sequence Page */}
            <Tooltip title={t('LEARNING_PATHS.OPEN_SEQUENCE')}>
              <IconButton
                size="small"
                aria-label={t('LEARNING_PATHS.OPEN_SEQUENCE')}
                onClick={() => router.push(builderHref(row.id))}
                sx={actionButtonSx}
              >
                <ArrowForwardIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>

            {/* Enrol button: Open Enrol Dialog */}
            <Tooltip title={t('LEARNING_PATHS.ENROL_USERS_OR_GROUPS')}>
              <IconButton
                size="small"
                aria-label={t('LEARNING_PATHS.ENROL_USERS_OR_GROUPS')}
                onClick={() => handleOpenEnrol(row)}
                sx={actionButtonSx}
              >
                <PersonAddAlt1OutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [t, router.locale]
  );

  return (
    <Box sx={{ py: 1 }}>
      {/* Breadcrumb Navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="body2" sx={{ color: NEUTRAL.muted, fontSize: '13px' }}>
          {t('LEARNING_PATHS.BREADCRUMB_LEARNING')}
        </Typography>
        <Typography variant="body2" sx={{ color: NEUTRAL.subtle, fontSize: '13px' }}>
          /
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '13px', fontWeight: 600 }}>
          {t('LEARNING_PATHS.TITLE')}
        </Typography>
      </Box>

      {/* Header & Create CTA */}
      <PageHeader
        title={
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.2 }}>
            {t('LEARNING_PATHS.TITLE')}
          </Box>
        }
        subtitle={t('LEARNING_PATHS.SUBTITLE')}
        actions={
          <CommonButton variant="primary" onClick={() => router.push('/learning-paths/builder')}>
            {t('LEARNING_PATHS.CREATE')}
          </CommonButton>
        }
      />

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <SwadhaarDataTable<LearningPathItem>
        columns={columns}
        data={learningPaths}
        keyExtractor={(item) => item.id}
        loading={loading}
        error={error}
        onRetry={fetchLearningPaths}
        hideToolbar={true}
        emptyMessage={t('LEARNING_PATHS.EMPTY')}
      />

      {/* Enrol Dialog */}
      <EnrolLearningPathModal
        open={isEnrolModalOpen}
        onClose={() => setIsEnrolModalOpen(false)}
        learningPathTitle={activePath?.name}
        pathwayId={activePath?.id}
        onEnrolSuccess={handleEnrolSuccess}
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
