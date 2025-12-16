/* eslint-disable @nx/enforce-module-boundaries */
// import "@/styles/globals.css";

import './../styles/globals.css';
import type { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import { initGA, logPageView } from '../utils/googleAnalytics';

import { useEffect, useState } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { telemetryFactory } from '../utils/telemetry';
import FullLayout from '@/components/layouts/FullLayout';
import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles';
import customTheme from '../styles/customTheme';
import './../styles/style.css';
import Head from 'next/head';

import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import 'react-circular-progressbar/dist/styles.css';
import { useRouter } from 'next/router';
import { Role, TelemetryEventType, metaTags } from '@/utils/app.constant';
import useSubmittedButtonStore from '@/utils/useSharedState';
import RouteGuard from '@/components/RouteGuard';
import TenantService from '@/services/TenantService';

//menu config
import MenuWrapper from '../config/MenuWrapper';
import { LanguageProvider } from '@shared-lib-v2/lib/context/LanguageContext';

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const setIsArchived = useSubmittedButtonStore(
    (state: any) => state.setIsArchived
  );
  useEffect(() => {
    const tenantId = localStorage.getItem('tenantId');
    if (tenantId) {
      TenantService.setTenantId(tenantId);
    }
    telemetryFactory.init();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token && router.pathname !== '/home') {
      if (router.pathname !== '/logout') router.push('/logout');
    }
    setIsArchived(false);
  }, [router]);

  /*useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return; // Exit early if not in browser

    const adminInfo = localStorage.getItem('adminInfo');

    if (!adminInfo || adminInfo === 'undefined') return;

    const userInfo = JSON.parse(adminInfo);

    const restrictedRoles = [
      Role.ADMIN,
      Role.CENTRAL_ADMIN,
      Role.SCTA,
      Role.CCTA,
    ];

    const restrictedPaths = ['/unauthorized', '/login', '/logout'];
    const isRestrictedRole = !restrictedRoles.includes(userInfo?.role);
    const isRestrictedPath = !restrictedPaths.includes(router.pathname);

    if (isRestrictedRole && isRestrictedPath) {
      router.push({
        pathname: '/unauthorized',
        query: { role: userInfo?.role },
      });
    }
  }, [router]);*/

  useEffect(() => {
    // Initialize GA only once
    if (!window.GA_INITIALIZED) {
      initGA(`${process.env.NEXT_PUBLIC_MEASUREMENT_ID_ADMIN}`);
      window.GA_INITIALIZED = true;
    }

    const handleRouteChange = (url: string) => {
      const windowUrl = url;
      const cleanedUrl = windowUrl.replace(/^\//, '');

      const telemetryImpression = {
        context: {
          env: cleanedUrl,
          cdata: [],
        },
        edata: {
          type: TelemetryEventType.VIEW,
          subtype: '',
          pageid: cleanedUrl,
          uri: '',
        },
      };
      telemetryFactory.impression(telemetryImpression);

      logPageView(url);
    };

    // Log initial page load
    handleRouteChange(window.location.pathname);
    // Subscribe to route changes and log page views
    router.events.on('routeChangeComplete', handleRouteChange);

    // Clean up the subscription on unmount
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  const renderComponent = () => {
    if (pageProps.noLayout) {
      return <Component {...pageProps} />;
    } else {
      return (
        <FullLayout>
          <Component {...pageProps} />
        </FullLayout>
      );
    }
  };

  const [client] = useState(
    new QueryClient({
      defaultOptions: {
        queries: {
          gcTime: 1000 * 60 * 60 * 24, // 24 hours
          staleTime: 1000 * 60 * 60 * 24, // 24 hours
        },
      },
    })
  );

  return (
    <>
      <Head>
        <title>{metaTags?.title}</title>
      </Head>
      <LanguageProvider>
      <QueryClientProvider client={client}>
        <AuthProvider>
          {/* for dynamic menu */}
          <CssVarsProvider theme={customTheme}>
            {/* <RouteGuard>{renderComponent()}</RouteGuard> */}
            <MenuWrapper>{renderComponent()}</MenuWrapper>
            <ToastContainer
              position="bottom-left"
              autoClose={3000}
              stacked={false}
            />
          </CssVarsProvider>
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
      </LanguageProvider>
    </>
  );
}

export default appWithTranslation(App);
