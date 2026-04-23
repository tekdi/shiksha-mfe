"use client";

import { useTenantTheme } from "../hooks/useTenantTheme";

/**
 * Component to update CSS variables based on tenant theme
 * This should be placed inside TenantProvider
 */
export default function TenantThemeUpdater() {
  useTenantTheme();
  return null;
}

