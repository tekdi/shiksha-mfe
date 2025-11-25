import { useEffect } from "react";
import { useTenant } from "../context/TenantContext";

/**
 * Hook to apply tenant theme colors to CSS variables globally
 */
export const useTenantTheme = () => {
  const { contentFilter, isLoading } = useTenant();

  // Update CSS variables when tenant data is available
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isLoading) return; // Wait for tenant to load

    const primaryColor = contentFilter?.theme?.primaryColor || "#E6873C";
    const secondaryColor = contentFilter?.theme?.secondaryColor || "#1A1A1A";
    const backgroundColor =
      contentFilter?.backgroundColor || contentFilter?.theme?.backgroundColor ||
      "#F5F5F5";
    const buttonTextColor = contentFilter?.buttonTextColor || contentFilter?.theme?.buttonTextColor || "#FFFFFF";
    // Update CSS variables
    const root = document.documentElement;
    root.style.setProperty("--tenant-primary-color", primaryColor);
    root.style.setProperty("--tenant-secondary-color", secondaryColor);
    root.style.setProperty("--tenant-background-color", backgroundColor);
    root.style.setProperty("--tenant-button-text-color", buttonTextColor);
    
    // Also update existing CSS variables for backward compatibility
    root.style.setProperty("--primary-color", primaryColor);
    root.style.setProperty("--btn-outline", primaryColor);
    root.style.setProperty("--foreground", primaryColor);
    root.style.setProperty("--general-btn-hover-bg", primaryColor);
    root.style.setProperty("--secondary-btn-bg", primaryColor);
    root.style.setProperty("--secondary-btn-hover-bg", primaryColor);
    root.style.setProperty("--disabled-btn-text", primaryColor);
    root.style.setProperty("--general-btn-text-color", buttonTextColor);

    // Update theme color meta tag
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", primaryColor);
    }
  }, [contentFilter, isLoading]);
};
