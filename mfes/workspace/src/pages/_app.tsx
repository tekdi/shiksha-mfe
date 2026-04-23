import { AppProps } from "next/app";
import * as React from "react";
import Head from "next/head";
import { Experimental_CssVarsProvider as CssVarsProvider } from "@mui/material/styles";
import { appWithTranslation } from "next-i18next";
import "../styles/global.css";
import customTheme from "../styles/CustomTheme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
function CustomApp({ Component, pageProps }: AppProps) {
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
  return (
    <>
      <Head>
        <title>Welcome to workspace!</title>
      </Head>
      <main className="app">
        <CssVarsProvider theme={customTheme}>
          <QueryClientProvider client={client}>
            <Component {...pageProps} />
          </QueryClientProvider>
        </CssVarsProvider>
      </main>
    </>
  );
}
export default appWithTranslation(CustomApp);