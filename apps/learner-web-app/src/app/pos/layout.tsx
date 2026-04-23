import "react-toastify/dist/ReactToastify.css";
import POSMuiThemeProvider from "@learner/assets/theme/POSMuiThemeProvider";
import { GlobalProvider } from "@learner/components/Provider/GlobalProvider";
import GoogleAnalyticsTracker from "@learner/components/GoogleAnalyticsTracker/GoogleAnalyticsTracker";

export const metadata = {
  title: "Welcome to ",
  description:
    "Shiksha-app is a platform for users to learn and grow by consuming educational content",
  openGraph: {
    title: "Welcome to",
    description:
      "Shiksha-app is a platform for users to learn and grow by consuming educational content",
    images: [
      {
        url: `/logo.png`,
        width: 800,
        height: 600,
      },
    ],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <GlobalProvider>
      <POSMuiThemeProvider>
        <GoogleAnalyticsTracker />
        {children}
      </POSMuiThemeProvider>
    </GlobalProvider>
  );
}
