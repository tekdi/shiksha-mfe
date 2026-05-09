/* eslint-disable @nx/enforce-module-boundaries */
"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { checkAuth } from "@shared-lib-v2/utils/AuthService";
import { Box, CircularProgress } from "@mui/material";

import { publicRoutes as basePublicRoutes, isPublicRoute } from "@/utils/routeUtils";

interface AuthGuardProps {
  children: React.ReactNode;
}

// Auth-related pages that are only relevant to the guard, not the middleware
const guardPublicRoutes = [
  ...basePublicRoutes,
  "/login-simple",
  "/registration",
  "/password-forget",
  "/reset-Password",
  "/logout",
];

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const pathname = usePathname();
  
  // Immediate synchronous check on client side - use window.location for more reliable path detection
  if (typeof window !== "undefined") {
    // Use window.location.pathname for more reliable path detection
    const currentPath = window.location.pathname;
    
    // Check if route is public
    if (!isPublicRoute(currentPath, guardPublicRoutes)) {
      const authenticated = checkAuth();
      if (!authenticated) {
        // Store the current path to redirect back after login
        const fullPath = currentPath + window.location.search;
        if (
          fullPath !== "/login" &&
          fullPath !== "/login-simple" &&
          !fullPath.startsWith("/login")
        ) {
          sessionStorage.setItem("redirectAfterLogin", fullPath);
        }
        // Immediately redirect - this will prevent any rendering
        window.location.replace("/login");
        // Return loading spinner while redirecting
        return (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "100vh",
            }}
          >
            <CircularProgress />
          </Box>
        );
      }
    }
  }

  // If authenticated or public route, render children
  return <>{children}</>;
};

export default AuthGuard;

