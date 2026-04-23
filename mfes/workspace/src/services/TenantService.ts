import { fetchTenantConfig, TenantConfig } from '../utils/fetchTenantConfig';

class TenantService {
  private static instance: TenantService;
  private tenantId = '';
  private tenantConfig: TenantConfig | null = null; // Use null to match fetchTenantConfig return type
  private storageKey: string;

  private constructor() {
    // Get tenant ID from multiple sources (URL params, localStorage)
    // URL params take priority since iframes have isolated localStorage
    if (typeof window !== 'undefined') {
      // First check URL parameters (for iframe scenarios)
      const urlParams = new URLSearchParams(window.location.search);
      const tenantIdFromUrl = urlParams.get('tenantId');
      
      if (tenantIdFromUrl) {
        this.tenantId = tenantIdFromUrl;
        console.log('Workspace TenantService: Constructor - Found tenantId in URL:', tenantIdFromUrl);
        // Store in localStorage for future use
        if (window.localStorage) {
          localStorage.setItem('tenantId', tenantIdFromUrl);
        }
      } else if (window.localStorage) {
        // Fallback to localStorage
        const tenantId = localStorage.getItem('tenantId');
        console.log('Workspace TenantService: Constructor - localStorage tenantId:', tenantId);
        if (tenantId) {
          this.tenantId = tenantId;
        }
      }
    }
    this.storageKey = `tenantConfig_${this.tenantId}`;
    console.log('Workspace TenantService: Constructor - Final tenantId:', this.tenantId);
  }

  public static getInstance(): TenantService {
    if (!TenantService.instance) {
      TenantService.instance = new TenantService();
    }
    return TenantService.instance;
  }

  public getTenantId(): string {
    // If tenantId is not set, check URL params and localStorage again (in case it was set after initialization)
    if (!this.tenantId && typeof window !== 'undefined') {
      // Check URL parameters first (for iframe scenarios)
      const urlParams = new URLSearchParams(window.location.search);
      const tenantIdFromUrl = urlParams.get('tenantId');
      
      if (tenantIdFromUrl) {
        console.log('Workspace TenantService: getTenantId - Found tenantId in URL:', tenantIdFromUrl);
        this.tenantId = tenantIdFromUrl;
        this.storageKey = `tenantConfig_${this.tenantId}`;
        // Store in localStorage for future use
        if (window.localStorage) {
          localStorage.setItem('tenantId', tenantIdFromUrl);
        }
      } else if (window.localStorage) {
        // Fallback to localStorage
        const storedTenantId = localStorage.getItem('tenantId');
        if (storedTenantId) {
          console.log('Workspace TenantService: getTenantId - Found tenantId in localStorage:', storedTenantId);
          this.tenantId = storedTenantId;
          this.storageKey = `tenantConfig_${this.tenantId}`;
        }
      }
    }
    console.log('Workspace TenantService: getTenantId called, returning:', this.tenantId);
    return this.tenantId;
  }


  public setTenantId(tenantId: string) {
    // Clear cached config if tenant ID is changing
    if (this.tenantId !== tenantId) {
      this.tenantConfig = null;
    }
    this.tenantId = tenantId;
    this.storageKey = `tenantConfig_${this.tenantId}`;
    // Store in localStorage for consistency with login process
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('tenantId', tenantId);
    }
  }

  public async getTenantConfig(): Promise<TenantConfig> {
    // Ensure we have a tenant ID before fetching config
    if (!this.tenantId) {
      const tenantId = this.getTenantId();
      if (!tenantId) {
        throw new Error('Tenant ID is not set. Please set tenant ID before fetching tenant config.');
      }
    }
    
    if (!this.tenantConfig) {
      this.tenantConfig = await fetchTenantConfig(this.tenantId);
    }
    if (!this.tenantConfig) {
      throw new Error('Failed to fetch tenant configuration');
    }
    return this.tenantConfig;
  }
}

export default TenantService.getInstance();
