// pages/index.tsx — Root landing: Swadhaar Splash Screen
import React from "react";
import dynamic from "next/dynamic";

const title = "Swadhaar Training Platform";
const description = "Learn. Grow. — Swadhaar FinAccess learner training platform.";

export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    images: [{ url: `/swadhar_logo.png`, width: 800, height: 600 }],
    type: "website",
  },
};

const SplashScreen = dynamic(() => import("@learner/app/splash/page"), {
  ssr: false,
});

const App = () => {
  return <SplashScreen />;
};

export default App;
