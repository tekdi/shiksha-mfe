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
import { getCourseList, CourseItem } from '@/services/CourseService';
import { getCohortSearch } from '@/services/CohortService';
import EnrolLearningPathModal from '@/components/common/EnrolLearningPathModal';
import { BRAND, NEUTRAL } from '@/styles/customTheme';

export interface LearningPathItem {
  id: string;
  name: string;
  codeRange?: string;
  steps: string;
  enrolled: string;
  startDate: string;
  endDate: string;
  certificate: string;
  coursesCount?: number;
}

const PRIMARY_PATH_ID = 'financial-inclusion-training-programme';
const PRIMARY_PATH_NAME = 'Financial Inclusion Training Programme';

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
  const [activePathTitle, setActivePathTitle] = useState<string>(PRIMARY_PATH_NAME);

  // Fetch courses from composite search API to build pathways
  const fetchLearningPaths = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [coursesRes, cohortRes] = await Promise.allSettled([
        getCourseList({
          limit: 20,
          filters: {
            primaryCategory: ['Course'],
          },
        }),
        getCohortSearch({
          limit: 1,
          filters: { status: ['active'] },
        }),
      ]);

      const courses: CourseItem[] =
        coursesRes.status === 'fulfilled' ? coursesRes.value?.content || [] : [];
      const totalCourses = courses.length || 7;
      const groupCount =
        cohortRes.status === 'fulfilled' ? cohortRes.value?.result?.count ?? 4 : 4;

      // 1. Primary flagship learning path (Financial Inclusion Training Programme)
      const primaryPath: LearningPathItem = {
        id: PRIMARY_PATH_ID,
        name: PRIMARY_PATH_NAME,
        codeRange: t('LEARNING_PATHS.COURSE_RANGE', { from: 0, to: Math.max(courses.length - 1, 6) }),
        steps: t('LEARNING_PATHS.STEPS_COURSES', { n: totalCourses }),
        enrolled: `${groupCount} cohorts`,
        startDate: '01 Nov 2026',
        endDate: '31 Dec 2026',
        certificate: t('LEARNING_PATHS.ON_COMPLETION'),
        coursesCount: totalCourses,
      };

      // 2. Additional tracks derived from live Sunbird courses
      const otherPaths: LearningPathItem[] = courses.slice(0, 2).map((c, idx) => {
        const isFirst = idx === 0;
        return {
          id: c.identifier || `path-${idx}`,
          name: t('LEARNING_PATHS.TRACK_NAME', { name: c.cleanTitle || c.name }),
          codeRange: c.courseCode || t('LEARNING_PATHS.MODULE_N', { n: idx + 1 }),
          steps: t('LEARNING_PATHS.STEPS_SECTIONS', { n: c.leafNodesCount || 4 }),
          enrolled: isFirst ? '2 cohorts' : '1 cohort',
          startDate: '01 Nov 2026',
          endDate: '31 Dec 2026',
          certificate: isFirst ? t('LEARNING_PATHS.ON_COMPLETION') : '—',
          coursesCount: 1,
        };
      });

      setLearningPaths([primaryPath, ...otherPaths]);
    } catch (err) {
      console.error('Error fetching courses for learning paths:', err);
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
    setActivePathTitle(path.name);
    setIsEnrolModalOpen(true);
  };

  const handleEnrolSuccess = (count: number, type: 'groups' | 'users') => {
    const enrolled =
      type === 'groups'
        ? `${count} cohorts`
        : `${count} individual users`;
    setLearningPaths((prev) =>
      prev.map((item) => (item.name === activePathTitle ? { ...item, enrolled } : item))
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
      {
        id: 'dates',
        label: t('LEARNING_PATHS.COL_START_END'),
        labelKey: 'LEARNING_PATHS.COL_START_END',
        minWidth: 160,
        render: (row) => (
          <Typography variant="body2" sx={{ color: NEUTRAL.muted, fontSize: '13px' }}>
            {row.startDate} – {row.endDate}
          </Typography>
        ),
      },
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
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.8 }}>
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
        learningPathTitle={activePathTitle}
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
