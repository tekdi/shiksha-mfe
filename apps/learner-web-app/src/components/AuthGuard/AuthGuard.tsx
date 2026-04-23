/* eslint-disable @nx/enforce-module-boundaries */
"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { checkAuth } from "@shared-lib-v2/utils/AuthService";
import { Box, CircularProgress } from "@mui/material";

interface AuthGuardProps {
  children: React.ReactNode;
}

// Public routes that don't require authentication
const publicRoutes = [
  "/login",
  "/login-simple",
  "/registration",
  "/password-forget",
  "/reset-Password",
  "/logout",
  "/",
  "/home",
  "/faqs",
  "/explore",
  "/unauthorized",
  // POS routes (public)
  "/pos",
  // Thematic routes (public)
  "/themantic",
];

// Check if route is public
const isPublicRoute = (pathname: string): boolean => {
  // Check exact matches
  if (publicRoutes.includes(pathname)) {
    return true;
  }

  // Check if pathname starts with any public route
  return publicRoutes.some((route) => pathname.startsWith(route));
};

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const pathname = usePathname();
  
  // Immediate synchronous check on client side - use window.location for more reliable path detection
  if (typeof window !== "undefined") {
    // Use window.location.pathname for more reliable path detection
    const currentPath = window.location.pathname;
    
    // Check if route is public
    if (!isPublicRoute(currentPath)) {
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

