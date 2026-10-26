import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../../next-i18next.config.js';
import AssessmentBuilder from '@/components/content/AssessmentBuilder';

export default function AssessmentBuilderPage() {
  const { id } = useRouter().query;
  return <AssessmentBuilder assessmentId={typeof id === 'string' ? id : ''} />;
}

export const getStaticProps = async ({ locale }: { locale: string }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'], nextI18NextConfig as any)),
    },
  };
};

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
});
