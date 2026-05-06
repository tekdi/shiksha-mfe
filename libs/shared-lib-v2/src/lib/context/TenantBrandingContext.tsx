"use client";
import React, {
  createContext,
  ReactNode,
  useContext,
  useMemo,
} from "react";

export interface TenantPalette {
  primary?: string;
  secondary?: string;
  background?: string;
  text?: string;
}

export interface TenantBranding {
  /** Display name of the tenant (e.g. "Pratham", "YouthNet"). */
  name: string;
  /** URL or path to the tenant's logo. */
  logo: string;
  /** Optional explicit alt text for the logo. Falls back to `${name} logo`. */
  logoAlt?: string;
  /** Optional brand color palette applied to MUI theme overrides downstream. */
  palette?: TenantPalette;
  /** CSS font-family stack for tenant-specific typography. */
  fontFamily?: string;
  /** Public support contact for the tenant. */
  supportEmail?: string;
}

export const DEFAULT_TENANT_BRANDING: TenantBranding = {
  name: "Pratham",
  logo: "/logo.png",
};

const TenantBrandingContext = createContext<TenantBranding | null>(null);

interface TenantBrandingProviderProps {
  branding?: Partial<TenantBranding>;
  children: ReactNode;
}

export const TenantBrandingProvider: React.FC<TenantBrandingProviderProps> = ({
  branding,
  children,
}) => {
  const value = useMemo<TenantBranding>(
    () => ({ ...DEFAULT_TENANT_BRANDING, ...branding }),
    [branding]
  );

  return (
    <TenantBrandingContext.Provider value={value}>
      {children}
    </TenantBrandingContext.Provider>
  );
};

export const useTenantBranding = (): TenantBranding => {
  const context = useContext(TenantBrandingContext);
  return context ?? DEFAULT_TENANT_BRANDING;
};