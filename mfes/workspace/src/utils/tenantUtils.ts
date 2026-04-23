import Cookies from 'js-cookie';

/**
 * Utility functions for managing tenant ID
 */

export const setTenantId = (tenantId: string): void => {
  if (typeof window !== 'undefined') {
    // Set in cookies (primary storage)
    Cookies.set('tenantId', tenantId, {
      expires: 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    // Also set in localStorage during transition period
    localStorage.setItem('tenantId', tenantId);
  }
};

export const getTenantId = (): string | null => {
  if (typeof window !== 'undefined') {
    // First check cookies
    const cookieTenantId = Cookies.get('tenantId');
    if (cookieTenantId) {
      return cookieTenantId;
    }

    // If not in cookies, check localStorage and migrate
    const localStorageTenantId = localStorage.getItem('tenantId');
    if (localStorageTenantId) {
      console.log(
        'Migrating tenant ID from localStorage to cookies:',
        localStorageTenantId
      );
      setTenantId(localStorageTenantId);
      return localStorageTenantId;
    }
  }
  return null;
};

export const clearTenantId = (): void => {
  if (typeof window !== 'undefined') {
    Cookies.remove('tenantId');
    localStorage.removeItem('tenantId');
  }
};

/**
 * Initialize tenant ID from URL parameters or other sources
 * This should be called when the app starts
 */
export const initializeTenantId = (): void => {
  if (typeof window === 'undefined') return;

  // Check if tenant ID is already set (this will also migrate from localStorage)
  const existingTenantId = getTenantId();
  if (existingTenantId) {
    console.log('Tenant ID already set:', existingTenantId);
    return;
  }

  // Try to get tenant ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const tenantIdFromUrl = urlParams.get('tenantId');

  if (tenantIdFromUrl) {
    setTenantId(tenantIdFromUrl);
    console.log('Tenant ID set from URL:', tenantIdFromUrl);
    return;
  }

  // Try to get from environment variables or other sources
  const defaultTenantId = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID;
  if (defaultTenantId) {
    setTenantId(defaultTenantId);
    console.log('Tenant ID set from environment:', defaultTenantId);
    return;
  }

  console.warn('No tenant ID found. Please set tenant ID manually.');
};
