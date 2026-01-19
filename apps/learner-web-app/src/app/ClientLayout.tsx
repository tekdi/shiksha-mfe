/* eslint-disable no-empty */
/* eslint-disable @nx/enforce-module-boundaries */
"use client";

import React, { useEffect } from "react";
import { FontSizeProvider } from "../context/FontSizeContext";
import { UnderlineLinksProvider } from "../context/UnderlineLinksContext";
import { telemetryFactory } from "../utils/telemtery";
import AuthGuard from "../components/AuthGuard/AuthGuard";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    telemetryFactory.init();
console.log("Telemetry initialized");
    // Set userId in cookies for cross-port access
    const currentUserId = localStorage.getItem("userId");
   
    
    if (currentUserId) {
      const domain = window.location.hostname;
      const cookieValue = `userId=${currentUserId}; path=/; domain=${domain}; SameSite=Lax; Secure=false`;
      document.cookie = cookieValue;
     
      
      // Also try setting without domain restriction
      const cookieValueNoDomain = `userId=${currentUserId}; path=/; SameSite=Lax; Secure=false`;
      document.cookie = cookieValueNoDomain;
     
    } else {
    }

    // Listen for force logout events from other tabs
    const handleForceLogout = (event: CustomEvent) => {
      console.log("Force logout event received:", event.detail);

      // Clear all storage
      try {
        localStorage.clear();
        sessionStorage.clear();

        // Clear all cookies
        document.cookie.split(";").forEach(function (c) {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(
              /=.*/,
              "=;expires=" + new Date().toUTCString() + ";path=/"
            );
        });

        console.log("All sessions cleared due to force logout event");

        // Redirect to login page
        window.location.href = "/login";
      } catch (error) {
        console.error("Error during force logout:", error);
        // Fallback redirect
        window.location.href = "/login";
      }
    };

    // Add event listener for force logout
    window.addEventListener("forceLogout", handleForceLogout as EventListener);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener(
        "forceLogout",
        handleForceLogout as EventListener
      );
    };
  }, []);

  return (
    <AuthGuard>
      <FontSizeProvider>
        <UnderlineLinksProvider>{children}</UnderlineLinksProvider>
      </FontSizeProvider>
    </AuthGuard>
  );
}
