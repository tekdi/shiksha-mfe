import './../styles/globals.css';

import { AppProps } from 'next/app';
import * as React from 'react';
import Head from 'next/head';
import { Poppins } from 'next/font/google';
import { appWithTranslation, UserConfig, useTranslation } from 'next-i18next';
import { metaTags, Telemetry } from '../utils/app.constant';
import {
  Experimental_CssVarsProvider as CssVarsProvider,
  useTheme,
} from '@mui/material/styles';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { CacheProvider } from '@emotion/react';
import { useDirection } from '../hooks/useDirection';
import nextI18NextConfig from '../../next-i18next.config.js';
import createCache from '@emotion/cache';
import { useRouter } from 'next/router.js';
import { fullWidthPages } from '../utils/app.config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { telemetryFactory } from '../utils/telemetry';
import { useEffect } from 'react';
import { initGA, logPageView } from '../utils/googleAnalytics';
import { prefixer } from 'stylis';
import customTheme from '../styles/customTheme';
import rtlPlugin from 'stylis-plugin-rtl';
import { Box, IconButton } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import { LanguageProvider } from '@shared-lib-v2/lib/context/LanguageContext';
import Notification from '../components/Notification';
import AllowNotification from '../components/AllowNotification';

const ColorModeContext = React.createContext({ toggleColorMode: () => {} });
const poppins = Poppins({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  fallback: ['sans-serif'],
  subsets: ['latin'],
});

const emptyInitialI18NextConfig: UserConfig = {
  i18n: {
    defaultLocale: nextI18NextConfig.i18n.defaultLocale,
    locales: nextI18NextConfig.i18n.locales,
  },
};

let myTheme: any;

export function DarkTheme() {
  const theme = useTheme();
  const colorMode = React.useContext(ColorModeContext);
  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        color: 'text.primary',
        borderRadius: 1,
      }}
    >
      <IconButton onClick={colorMode.toggleColorMode} color="inherit">
        {theme.palette.mode === 'dark' ? (
          <Brightness7Icon />
        ) : (
          <Brightness4Icon />
        )}
      </IconButton>
    </Box>

  );
}

function CustomApp({ Component, pageProps }: AppProps) {
  const { i18n } = useTranslation(); // Get the i18n object to access the selected language
  const [client] = React.useState(
    new QueryClient({
      defaultOptions: {
        queries: {
          gcTime: 1000 * 60 * 60 * 24, // 24 hours
          staleTime: 1000 * 60 * 60 * 24, // 24 hours
        },
      },
    })
  );

  const router = useRouter();
  const isFullWidthPage = fullWidthPages.includes(router.pathname);

  useEffect(() => {
    const htmlElement = document.documentElement;
    if (i18n.language === 'ur') {
      htmlElement.setAttribute('dir', 'rtl');
    } else {
      htmlElement.setAttribute('dir', 'ltr');
    }
  }, [i18n.language]);

  useEffect(() => {
    try {
      telemetryFactory.init();
    } catch (error) {
      console.error('Telemetry initialization failed:', error);
    }
  }, []);

  const theme = useTheme<any>();
  const { dir, isRTL } = useDirection();

  const rtlCache = createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
  });

  const ltrCache = createCache({
    key: 'mui',
  });
  const login = router.pathname === '/login';

  return (
    <>
      <style jsx global>{`
        html {
          font-family: ${poppins.style.fontFamily} !important;
        }
      `}</style>
      <Head>
        <title>{metaTags?.title}</title>
        <meta name="description" content={metaTags?.description} />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </Head>
      <LanguageProvider>

      <CacheProvider value={isRTL ? rtlCache : ltrCache}>
        <CssVarsProvider theme={customTheme}>
          <QueryClientProvider client={client}>
            <Component {...pageProps} />
          </QueryClientProvider>
          <ToastContainer
            position="bottom-left"
            autoClose={3000}
            stacked={false}
          />
                      <Notification/>
                                  {!login && <AllowNotification/>}

          
        </CssVarsProvider>
      </CacheProvider>
      </LanguageProvider>

    </>
  );
}

export default appWithTranslation(CustomApp, emptyInitialI18NextConfig);
