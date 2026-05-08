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
  "/splash",
  "/language-selection",
  "/home",
  "/faqs",
  "/explore",
  "/unauthorized",
  // Swadhaar onboarding routes
  "/splash",
  "/language-selection",
  "/swadhaar-login",
  "/swadhaar-home",
  "/learn",
  "/alerts",
  "/swadhar-profile",
  // POS routes (public)
  "/pos",
  // Thematic routes (public)
  "/themantic",
];

// Check if route is public
const isPublicRoute = (pathname: string): boolean => {
  // Exact match for the root path
  if (pathname === "/") {
    return true;
  }

  // Check exact matches for all public routes
  if (publicRoutes.includes(pathname)) {
    return true;
  }

  // Check if pathname starts with any public route (prefix match)
  // Skip "/" for prefix matching to avoid matching everything
  return publicRoutes.some((route) => {
    if (route === "/") return false;
    return pathname.startsWith(route + "/") || pathname === route;
  });
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
        const isSwadhaar = currentPath.startsWith("/swadhaar") || 
                          currentPath.startsWith("/swadhar") || 
                          currentPath.startsWith("/learn") || 
                          currentPath.startsWith("/alerts");
        
        window.location.replace(isSwadhaar ? "/swadhaar-login" : "/login");
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

