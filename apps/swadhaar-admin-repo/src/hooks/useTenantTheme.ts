import { useEffect, useState } from 'react';
import TenantService, { TenantBranding } from '@/services/TenantService';

/**
 * Hook to apply tenant theme colors & branding to CSS variables dynamically
 */
export const useTenantTheme = () => {
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applyTheme = async () => {
      try {
        const detectedTenantId = TenantService.resolveTenantFromHost();
        TenantService.setTenantId(detectedTenantId);

        const data = await TenantService.getTenantBranding(detectedTenantId);
        setBranding(data);

        const primaryColor = data.primaryColor || '#E6873C';
        const secondaryColor = data.secondaryColor || '#1A1A1A';
        const backgroundColor = '#F5F5F5';
        const surfaceColor = '#FFFFFF';

        const root = document.documentElement;
        root.style.setProperty('--tenant-primary-color', primaryColor);
        root.style.setProperty('--tenant-secondary-color', secondaryColor);
        root.style.setProperty('--tenant-background-color', backgroundColor);
        root.style.setProperty('--tenant-surface-color', surfaceColor);

        // Update meta theme-color
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
          metaTheme.setAttribute('content', secondaryColor);
        }
      } catch (err) {
        console.error('Error applying tenant theme:', err);
      } finally {
        setIsLoading(false);
      }
    };

    applyTheme().catch((err) => console.error('Error applying tenant theme:', err));
  }, []);

  return { branding, isLoading };
};
