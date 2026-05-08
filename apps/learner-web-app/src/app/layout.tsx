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
import { headers } from "next/headers";

const DEFAULT_TITLE = "Welcome to shiksha-app";
const DEFAULT_DESCRIPTION =
  "Shiksha-app is a platform for users to learn and grow by consuming educational content";
const DEFAULT_ICON = "/logo.png";

export async function generateMetadata() {
  const host = headers().get('host') || '';
  const isSwadhaar = host.includes('swadhaar') || host.includes('localhost');
  
  const title = isSwadhaar ? "Swadhaar Learner" : DEFAULT_TITLE;
  const description = isSwadhaar ? "Swadhaar Learner Application" : DEFAULT_DESCRIPTION;
  const icon = isSwadhaar ? "/images/swadhar_logo.png" : DEFAULT_ICON;
  const themeColor = isSwadhaar ? "#E6873C" : "#1976d2";

  return {
    title,
    description,
    viewport: "width=device-width, initial-scale=1",
    themeColor,
    icons: {
      icon,
      shortcut: icon,
      apple: icon,
    },
    openGraph: {
      title,
      description,
      images: [{ url: icon }],
      type: "website",
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
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
