// app/layout.tsx
import "./global.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import MuiThemeProvider, {
  MuiThemeProviderWithLanguage,
} from "@learner/assets/theme/MuiThemeProvider";
import ClientLayout from "./ClientLayout";
import GoogleAnalyticsTracker from "@learner/components/GoogleAnalyticsTracker/GoogleAnalyticsTracker";
import { TenantProvider } from "@learner/context/TenantContext";
import TenantThemeUpdater from "./TenantThemeUpdater";
const DEFAULT_TITLE = "Welcome to shiksha-app";
const DEFAULT_DESCRIPTION =
  "Shiksha-app is a platform for users to learn and grow by consuming educational content";
const DEFAULT_ICON = "/logo.png";

export const metadata = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: DEFAULT_ICON }],
    type: "website",
  },
  icons: {
    icon: DEFAULT_ICON,
    shortcut: DEFAULT_ICON,
    apple: DEFAULT_ICON,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1976d2" />
        <link rel="icon" href={DEFAULT_ICON} />
        <link rel="shortcut icon" href={DEFAULT_ICON} />
        <link rel="apple-touch-icon" href={DEFAULT_ICON} />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedState = localStorage.getItem('isColorInverted');
                  if (savedState !== null) {
                    const isInverted = JSON.parse(savedState);
                    if (isInverted) {
                      document.documentElement.style.filter = 'invert(1) hue-rotate(180deg)';
                      
                      // Add style for images/videos
                      const style = document.createElement('style');
                      style.id = 'color-inversion-style-initial';
                      style.textContent = \`
                        img, video, iframe, svg, canvas, embed, object {
                          filter: invert(1) hue-rotate(180deg) !important;
                        }
                        [data-no-invert], [data-no-invert] * {
                          filter: invert(1) hue-rotate(180deg) !important;
                        }
                      \`;
                      document.head.appendChild(style);
                    }
                  }
                } catch (e) {
                  // Handle any localStorage errors silently
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <ClientLayout>
          <TenantProvider>
            <TenantThemeUpdater />
            <MuiThemeProviderWithLanguage>
              <GoogleAnalyticsTracker />

              <MuiThemeProvider>{children}</MuiThemeProvider>
            </MuiThemeProviderWithLanguage>
            <ToastContainer 
              position="bottom-center"
              autoClose={2000}
              hideProgressBar={true}
              newestOnTop={false}
              closeOnClick={false}
              rtl={false}
              pauseOnFocusLoss={false}
              draggable={false}
              pauseOnHover={false}
            />
          </TenantProvider>
        </ClientLayout>
      </body>
    </html>
  );
}
