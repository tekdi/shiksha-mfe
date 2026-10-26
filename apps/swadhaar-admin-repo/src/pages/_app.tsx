import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { appWithTranslation } from 'next-i18next';
import nextI18NextConfig from '../../next-i18next.config.js';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles';
import customTheme from '@/styles/customTheme';
import { AuthProvider } from '@/context/AuthContext';
import FullLayout from '@/components/layouts/FullLayout';
import RouteGuard from '@/components/RouteGuard';
import { publicRoutes } from '@/config/routesConfig';
import { metaTags } from '@/utils/app.constant';
import { useTenantTheme } from '@/hooks/useTenantTheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 mins TanStack cache deduplication
      retry: 1,
    },
  },
});

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isPublicPage = publicRoutes.includes(router.pathname);

  // Dynamic host-based tenant detection and branding application
  const { branding } = useTenantTheme();

  return (
    <>
      <Head>
        <title>{branding?.name || metaTags.title}</title>
        <meta name="description" content={metaTags.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#1A1A1A" />
      </Head>
      <QueryClientProvider client={queryClient}>
        <CssVarsProvider theme={customTheme} defaultMode="light" modeStorageKey="swadhaar_theme_mode">
          <AuthProvider>
            <RouteGuard>
              {isPublicPage ? (
                <Component {...pageProps} />
              ) : (
                <FullLayout>
                  <Component {...pageProps} />
                </FullLayout>
              )}
            </RouteGuard>
            <ToastContainer />
          </AuthProvider>
        </CssVarsProvider>
      </QueryClientProvider>
    </>
  );
}

export default appWithTranslation(App, nextI18NextConfig as any);
