"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  Tenant,
  TenantContentFilter,
  getTenantConfig,
  getStoredTenantConfig,
  getTenantContentFilter,
} from "@learner/utils/API/TenantService";

interface TenantContextType {
  tenant: Tenant | null;
  contentFilter: TenantContentFilter | null;
  isLoading: boolean;
  error: string | null;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
};

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [contentFilter, setContentFilter] = useState<TenantContentFilter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTenant = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First try to get from localStorage (faster)
      const storedTenant = getStoredTenantConfig();
      if (storedTenant) {
        setTenant(storedTenant);
        const filter = getTenantContentFilter(storedTenant);
        setContentFilter(filter);
        // Ensure tenantId is stored
        if (storedTenant.tenantId && typeof window !== "undefined") {
          localStorage.setItem("domainTenantId", storedTenant.tenantId);
        }
        setIsLoading(false);
      }

      // Then fetch fresh data from API
      const freshTenant = await getTenantConfig();
      if (freshTenant) {
        setTenant(freshTenant);
        const filter = getTenantContentFilter(freshTenant);
        setContentFilter(filter);
        // Ensure tenantId is stored (getTenantConfig should have done this, but double-check)
        if (freshTenant.tenantId && typeof window !== "undefined") {
          localStorage.setItem("domainTenantId", freshTenant.tenantId);
        }
      } else if (!storedTenant) {
        setError("No tenant configuration found for this domain");
      }
    } catch (err) {
      console.error("Error refreshing tenant:", err);
      setError(err instanceof Error ? err.message : "Failed to load tenant configuration");
      
      // Fallback to stored config if available
      const storedTenant = getStoredTenantConfig();
      if (storedTenant) {
        setTenant(storedTenant);
        const filter = getTenantContentFilter(storedTenant);
        setContentFilter(filter);
        // Ensure tenantId is stored
        if (storedTenant.tenantId && typeof window !== "undefined") {
          localStorage.setItem("domainTenantId", storedTenant.tenantId);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshTenant();
  }, []);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        contentFilter,
        isLoading,
        error,
        refreshTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

