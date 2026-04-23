import { useEffect, useState } from 'react';
import TenantService from '../services/TenantService';
import { TenantConfig } from '../utils/fetchTenantConfig';

const useTenantConfig = () => {
  const [tenantConfig, setTenantConfig] = useState<TenantConfig>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if tenant ID is available before trying to fetch config
        const tenantId = TenantService.getTenantId();
        if (!tenantId) {
          console.warn('Tenant ID not set, skipping tenant config fetch');
          setError('Tenant ID not set');
          return;
        }

        const config = await TenantService.getTenantConfig();
        setTenantConfig(config);
      } catch (err) {
        console.error('Error fetching tenant config:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to fetch tenant config'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { tenantConfig, isLoading, error };
};

export default useTenantConfig;
