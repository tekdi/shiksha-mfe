/* eslint-disable no-useless-escape */
/* eslint-disable @nx/enforce-module-boundaries */
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { checkAuth } from "@shared-lib-v2/utils/AuthService";
import { getUserId } from "@learner/utils/API/LoginService";
import { Box, CircularProgress, Typography } from "@mui/material";

const PlayerWithMobileCheck: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { slug } = params;
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkPlayerAccess = async () => {
      try {
        // Check if the URL contains a mobile number and magic link pattern
        const pathname = window.location.pathname;
        const fullUrl = window.location.href;
        
        // Pattern to match: /player/do_id/mobileNumber/activeLink/dashboard/magic-link/code
        const magicLinkPattern = /^\/player\/(do_[^\/]+)\/(\d{10,})\/activeLink\/dashboard\/magic-link\/([^\/]+)$/;
        const match = pathname.match(magicLinkPattern);

      

        if (match) {
          const [, identifier, mobileNumber, magicCode] = match;
          

          // Check if user is authenticated
          const isAuthenticated = checkAuth();
          

          if (!isAuthenticated) {
            console.log("User not authenticated, redirecting to login with magic link");
            // User not logged in, redirect to login with prefilled mobile number and magic code
            const loginUrl = `/login?redirectUrl=/player/${identifier}&prefilledUsername=${mobileNumber}&magicCode=${magicCode}`;
            console.log("Redirecting to:", loginUrl);
            window.location.href = loginUrl;
            return;
          }

          // User is logged in, check if username matches mobile number
          console.log("User authenticated, checking username match");
          try {
            const userResponse = await getUserId();
            console.log("API response:", userResponse);
            const currentUsername = userResponse?.username;
            console.log(
              "Current username:",
              currentUsername,
              "Mobile number:",
              mobileNumber
            );

            if (currentUsername === mobileNumber) {
              // Username matches mobile number, redirect to regular player route
              console.log(
                "Username matches mobile number, redirecting to player"
              );
              window.location.href = `/player/${identifier}`;
            } else {
              // Username doesn't match, close all active sessions and redirect to login
              console.log(
                "Username does not match mobile number, closing sessions and redirecting to login"
              );

              // Close all active sessions by clearing localStorage and cookies
              try {
                // Clear all localStorage items
                localStorage.clear();

                // Clear all cookies
                document.cookie.split(";").forEach(function (c) {
                  document.cookie = c
                    .replace(/^ +/, "")
                    .replace(
                      /=.*/,
                      "=;expires=" + new Date().toUTCString() + ";path=/"
                    );
                });

                // Clear sessionStorage as well
                sessionStorage.clear();

                // Dispatch a custom event to notify other tabs about logout
                if (typeof window !== "undefined") {
                  window.dispatchEvent(
                    new CustomEvent("forceLogout", {
                      detail: { reason: "username_mismatch", mobileNumber },
                    })
                  );
                }

                console.log("All active sessions cleared successfully");
              } catch (clearError) {
                console.error("Error clearing sessions:", clearError);
              }

              // Redirect to login with prefilled mobile number and magic code
              const loginUrl = `/login?redirectUrl=/player/${identifier}&prefilledUsername=${mobileNumber}&magicCode=${magicCode}`;
              console.log("Redirecting to:", loginUrl);

              // Force redirect using window.location for more reliable redirect
              window.location.href = loginUrl;
              return;
            }
          } catch (apiError) {
            console.error("Error fetching user details:", apiError);
            // On API error, redirect to login
            const loginUrl = `/login?redirectUrl=/player/${identifier}&prefilledUsername=${mobileNumber}&magicCode=${magicCode}`;
            console.log("API error, redirecting to:", loginUrl);
            window.location.href = loginUrl;
          }
        } else {
          // Check for old pattern (without magic link) for backward compatibility
          const playerMobilePattern = /^\/player\/(do_[^\/]+)\/(\d{10,})$/;
          const oldMatch = pathname.match(playerMobilePattern);
          
          if (oldMatch) {
            const [, identifier, mobileNumber] = oldMatch;
            console.log("Old pattern detected, redirecting to login");
            const loginUrl = `/login?redirectUrl=/player/${identifier}&prefilledUsername=${mobileNumber}`;
            window.location.href = loginUrl;
            return;
          }
          
          // Regular player URL without mobile number - check authentication first
          console.log("Regular player URL, checking authentication");
          const isAuthenticated = checkAuth();
          
          if (!isAuthenticated) {
            console.log("User not authenticated, redirecting to login");
            const identifier = Array.isArray(slug) ? slug[0] : slug;
            const currentPath = `/player/${identifier}${window.location.search}`;
            sessionStorage.setItem("redirectAfterLogin", currentPath);
            window.location.replace("/login");
            return;
          }
          
          // User is authenticated, redirect to proper route
          console.log("User authenticated, redirecting to proper route");
          const identifier = Array.isArray(slug) ? slug[0] : slug;
          window.location.href = `/player/${identifier}`;
        }
      } catch (error) {
        console.error("Error checking player access:", error);
        setError("An error occurred while checking access. Please try again.");
        setIsChecking(false);
      }
    };

    checkPlayerAccess();
  }, [router, slug]);

  if (isChecking) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body1" color="textSecondary">
          Checking authentication...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        gap={2}
      >
        <Typography variant="h6" color="error">
          {error}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Please try refreshing the page or contact support if the issue
          persists.
        </Typography>
      </Box>
    );
  }

  return null;
};

export default PlayerWithMobileCheck;
