import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const Home: React.FC = () => {
  const { push } = useRouter();
  const { t } = useTranslation();

  const [loading, setLoading] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        let tenantName = localStorage.getItem('tenantName');
        if (tenantName == 'YouthNet') {
          push('/youthnet');
        } else {
          push('/scp-teacher-repo');
        }
      } else {
        // Redirect to the AI Demo landing page instead of login for this demo
        push('/ai-demo', undefined, { locale: 'en' });
      }
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Service worker registered:', registration);
        })
        .catch((error) =>
          console.error('Service worker registration failed:', error)
        );
    }
  }, []);

  if (loading === null) return null;

  return <>{loading && <p>{t('COMMON.LOADING')}...</p>}</>;
};

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}

export default Home;
