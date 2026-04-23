/* eslint-disable @nx/enforce-module-boundaries */
"use client";

import React, { useLayoutEffect } from 'react';
import dynamic from 'next/dynamic';
import { checkAuth } from '@shared-lib-v2/utils/AuthService';

const Player = dynamic(() => import('@learner/components/Content/Player'), {
  ssr: false,
});

const App: React.FC = () => {
  // Immediate authentication check and redirect
  useLayoutEffect(() => {
    if (typeof window !== "undefined" && !checkAuth()) {
      const currentPath = window.location.pathname + window.location.search;
      if (
        currentPath !== "/login" &&
        currentPath !== "/login-simple" &&
        !currentPath.startsWith("/login")
      ) {
        sessionStorage.setItem("redirectAfterLogin", currentPath);
      }
      window.location.replace("/login");
    }
  }, []);

  // Don't render content if not authenticated
  if (typeof window !== "undefined" && !checkAuth()) {
    return null;
  }

  return <Player userIdLocalstorageName="userId" />;
};

export default App;
