import { SWADHAAR_TENANT_ID, SWADHAAR_CHANNEL_ID, SWADHAAR_FRAMEWORK } from '@/utils/app.constant';

export interface TenantConfig {
  CHANNEL_ID: string;
  CONTENT_FRAMEWORK: string;
  COLLECTION_FRAMEWORK: string;
  academicYearId?: string;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    buttonTextColor?: string;
  };
  LOGO_CONFIG?: {
    sidebar?: string;
    login?: string;
    favicon?: string;
    alt?: string;
  };
}

export interface TenantBranding {
  code: string;
  name: string;
  logoUrl?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  theme?: any;
}

class TenantService {
  private static instance: TenantService;
  private tenantId: string = SWADHAAR_TENANT_ID;
  private channelId: string = SWADHAAR_CHANNEL_ID;
  private readonly tenantConfig: TenantConfig = {
    CHANNEL_ID: SWADHAAR_CHANNEL_ID,
    CONTENT_FRAMEWORK: SWADHAAR_FRAMEWORK,
    COLLECTION_FRAMEWORK: SWADHAAR_FRAMEWORK,
    academicYearId: 'edf1d200-21d8-417e-b844-1d04f92435f4',
    theme: {
      primaryColor: '#E6873C',
      secondaryColor: '#1C2B4A',
      backgroundColor: '#F5F5F5',
      buttonTextColor: '#FFFFFF',
    },
    LOGO_CONFIG: {
      sidebar: '/images/swadhaar-logo.png',
      login: '/images/swadhaar-logo.png',
      favicon: '/favicon.ico',
      alt: 'Swadhaar FinAccess Logo',
    },
  };

  private constructor() {
    if (typeof window !== 'undefined') {
      const storedTenantId = localStorage.getItem('tenantId');
      if (storedTenantId) {
        this.tenantId = storedTenantId;
      } else {
        localStorage.setItem('tenantId', SWADHAAR_TENANT_ID);
      }
      const storedChannelId = localStorage.getItem('channelId');
      if (storedChannelId) {
        this.channelId = storedChannelId;
      }
    }
  }

  public static getInstance(): TenantService {
    if (!TenantService.instance) {
      TenantService.instance = new TenantService();
    }
    return TenantService.instance;
  }

  public getTenantId(): string {
    return this.tenantId || SWADHAAR_TENANT_ID;
  }

  public setTenantId(tenantId: string) {
    this.tenantId = tenantId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('tenantId', tenantId);
    }
  }

  public getChannelId(): string {
    return this.channelId || SWADHAAR_CHANNEL_ID;
  }

  public setChannelId(channelId: string) {
    this.channelId = channelId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('channelId', channelId);
    }
  }

  public getTenantConfig(): Promise<TenantConfig> {
    return Promise.resolve(this.tenantConfig);
  }

  /**
   * Host-based tenant detection (aligned with Shikshagraha branding KI)
   */
  public resolveTenantFromHost(hostName?: string): string {
    if (typeof window === 'undefined' && !hostName) return SWADHAAR_TENANT_ID;
    const host = (hostName || (typeof window !== 'undefined' ? window.location.hostname : '')).toLowerCase();

    if (host.includes('swadhaar') || host.includes('swadhar')) {
      return SWADHAAR_TENANT_ID;
    }
    return this.getTenantId();
  }

  /**
   * Fetch branding details for dynamic tenant customization
   */
  public async getTenantBranding(tenantId?: string): Promise<TenantBranding> {
    const targetTenantId = tenantId || this.getTenantId();
    try {
      const base = typeof window !== 'undefined'
        ? (window as any).__ENV?.NEXT_PUBLIC_MIDDLEWARE_URL || process.env.NEXT_PUBLIC_MIDDLEWARE_URL
        : process.env.NEXT_PUBLIC_MIDDLEWARE_URL;

      if (base) {
        const response = await fetch(`${base}/tenant/branding/${targetTenantId}`, {
          headers: {
            'X-Tenant-Id': targetTenantId,
            'X-Channel-Id': this.getChannelId(),
          },
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          return data?.result || data?.data || {
            code: 'swadhaar',
            name: 'Swadhaar FinAccess',
            logoUrl: '/images/swadhaar-logo.png',
            primaryColor: '#E6873C',
            secondaryColor: '#1A1A1A',
          };
        }
      }
    } catch (e) {
      // Fallback to default Swadhaar config
    }

    return {
      code: 'swadhaar',
      name: 'Swadhaar FinAccess',
      logoUrl: '/images/swadhaar-logo.png',
      primaryColor: '#E6873C',
      secondaryColor: '#1A1A1A',
    };
  }
}

export default TenantService.getInstance();
