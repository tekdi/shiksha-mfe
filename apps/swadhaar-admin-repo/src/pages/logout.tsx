import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Loader from '@/components/Loader';
import { useAuth } from '@/context/AuthContext';
import { useTranslation, UserConfig } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../next-i18next.config.js';

export default function LogoutPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { logoutFun } = useAuth();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await logoutFun();
      } catch (err) {
        console.error('Logout error:', err);
      } finally {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('adminInfo');
        }
        router.replace('/login');
      }
    };

    handleLogout().catch((err) => console.error('Logout error:', err));
  }, [router, logoutFun]);

  return <Loader message={t('LAYOUT.LOGGING_OUT')} minHeight="100vh" />;
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'], nextI18NextConfig as UserConfig)),
    },
  };
}
