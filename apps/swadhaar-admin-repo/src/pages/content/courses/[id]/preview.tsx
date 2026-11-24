import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Alert, Box, CircularProgress } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../../../next-i18next.config.js';
import { CourseHierarchy, getCourseHierarchy, parseCourseName, courseLanguageLabelKey } from '@/services/CourseService';
import CoursePreviewDialog from '@/components/content/CoursePreviewDialog';

/** Course preview on its own route, rendered in the admin layout (sidebar and header stay). */
export default function CoursePreviewPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const courseId = typeof router.query.id === 'string' ? router.query.id : '';
  const basePath = router.asPath.startsWith('/courses') ? '/courses' : '/content/courses';

  const [course, setCourse] = useState<CourseHierarchy | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    setFailed(false);
    getCourseHierarchy(courseId)
      .then(setCourse)
      .catch((err) => {
        console.error('Failed to load course for preview:', err);
        setFailed(true);
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (failed || !course) return <Alert severity="error">{t('COURSES.DETAIL.LOAD_ERROR')}</Alert>;

  const parsed = parseCourseName(course.name || '');
  const audience = Array.isArray(course.audience)
    ? course.audience.join(', ')
    : course.audience || t('COURSES.DETAIL.DEFAULT_AUDIENCE');

  return (
    <CoursePreviewDialog
      onClose={() => router.push(`${basePath}/${courseId}`)}
      title={parsed.title || course.name || t('COURSES.DEFAULT_COURSE_TITLE')}
      description={course.description}
      image={course.image || undefined}
      languageLabel={t(courseLanguageLabelKey(course.languageCode))}
      audienceLabel={audience}
      sections={course.children || []}
      formatMinutes={(minutes) => (minutes ? t('COURSES.DURATION_MIN', { count: minutes }) : undefined)}
    />
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
