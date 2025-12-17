import axios from "axios";
const baseurl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL;

const TENANT_READ_API = `${baseurl}/tenant/read`;

export interface TenantTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  buttonTextColor?: string;
}

export interface SolutionItem {
  icon: string;
  title: string | Record<string, string>; // Support both string and language-specific object
  description: string | Record<string, string>; // Support both string and language-specific object
}

export interface HomePageContent {
  // Main content
  title?: string | Record<string, string>;
  description?: string | Record<string, string>;
  tagline?: string | Record<string, string>;
  
  // Button texts
  chooseLanguageText?: string | Record<string, string>;
  continueButtonText?: string | Record<string, string>;
  getStartedButtonText?: string | Record<string, string>;
  
  // Our Solutions section
  ourSolutionsTitle?: string | Record<string, string>;
  ourSolutionsDescription?: string | Record<string, string>;
  
  // Highlights (for Swadhaar tenant)
  highlights?: Array<{
    title: string | Record<string, string>;
    description: string | Record<string, string>;
  }>;
}

export interface TenantContentFilter {
  url: string;
  icon: string;
  theme: TenantTheme;
  title: string | Record<string, string>;
  tagline: string | Record<string, string>;
  sameOrigin: boolean;
  showGroups: boolean;
  showAttendance?: boolean;
  description: string | Record<string, string>;
  loginMethod: "otp" | "password";
  ourSolutions?: SolutionItem[];
  ourSolutionsTitle?: string | Record<string, string>;
  ourSolutionsDescription?: string | Record<string, string>;
  backgroundColor?: string;
  buttonTextColor?: string;
  languages?: string[];
  homePageContent?: HomePageContent;
}

export interface TenantParams {
  contentFilter: TenantContentFilter[];
}

export interface Tenant {
  ordering: number;
  tenantId: string;
  name: string;
  domain: string;
  createdAt: string;
  updatedAt: string;
  params: TenantParams;
  programImages?: Record<string, unknown>;
  description: string;
  status: string;
  programHead: string;
  templateId: string;
  contentFramework: string;
  channelId: string;
  collectionFramework: string;
  createdBy: string;
  updatedBy: string;
  contentFilter?: Record<string, unknown>;
  role: Array<{
    roleId: string;
    name: string;
    code: string;
  }>;
}

export interface TenantReadResponse {
  result?: Tenant[];
  data?: Tenant[];
}

/**
 * Fetches all tenants from the tenant read API
 */
export const fetchTenants = async (): Promise<Tenant[]> => {
  try {
    const response = await axios.get<TenantReadResponse>(TENANT_READ_API, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Handle different response structures
    const tenants = response.data?.result || response.data?.data || [];
    
    if (!Array.isArray(tenants)) {
      console.error("Tenant API returned invalid data structure:", response.data);
      return [];
    }

    return tenants;
  } catch (error) {
    console.error("Error fetching tenants:", error);
    throw error;
  }
};

/**
 * Finds a tenant by matching the domain name
 * Extracts the first word from the domain (e.g., "swadhaar" from "swadhaar.learner")
 * For now, hardcoded to return Swadhaar tenant
 */
export const findTenantByDomain = (
  tenants: Tenant[],
  currentDomain?: string
): Tenant | null => {
let domain = currentDomain;
// let domain = 'oblf-learner.sunbirdsaas.com'; // For testing only
  console.log('[TenantService] Looking up tenant for domain:', domain);
  if (!domain) {
    if (typeof window !== "undefined") {
      domain = window.location.hostname;
      console.log('[TenantService] Using window.location.hostname:', domain);
    } else {
      return null;
    }
  }

  const sanitizedDomain = domain.split(":")[0]?.toLowerCase() ?? "";
  if (!sanitizedDomain) {
    return null;
  }

  const domainParts = sanitizedDomain.split(".");
  // Skip "www" if it's the first part, then get the actual tenant name
  let tenantKey = domainParts[0];
  if (tenantKey === "www" && domainParts.length > 1) {
    tenantKey = domainParts[1];
  }
  
  // Handle hyphenated domains like "swadhaar-learner" -> extract "swadhaar"
  // This is for multi-environment tenants (e.g., swadhaar-learner, swadhaar-admin)
  const originalTenantKey = tenantKey;
  if (tenantKey.includes("-")) {
    const hyphenParts = tenantKey.split("-");
    tenantKey = hyphenParts[0]; // Get the first part before the hyphen
    console.log(`[TenantService] Extracted tenant key from hyphenated domain: "${originalTenantKey}" -> "${tenantKey}"`);
  }
  
  if (!tenantKey) {
    return null;
  }

  const matchedTenant = tenants.find((t) => {
    const tenantDomainKey = t.domain
      ?.toLowerCase()
      .split(":")[0]
      ?.split(".")[0];
    const tenantName = t.name?.toLowerCase();

    return (
      tenantDomainKey === tenantKey ||
      tenantDomainKey === sanitizedDomain ||
      tenantName === tenantKey
    );
  });

  if (!matchedTenant) {
    console.warn(`[TenantService] No tenant found for domain: ${sanitizedDomain}, extracted key: ${tenantKey}`);
    console.log(`[TenantService] Available tenants:`, tenants.map(t => ({ name: t.name, domain: t.domain })));
  } else {
    console.log(`[TenantService] Found tenant: ${matchedTenant.name} (${matchedTenant.domain}) for domain: ${sanitizedDomain}`);
  }

  return matchedTenant || null;
};

/**
 * Gets the tenant configuration for the current domain
 */
export const getTenantConfig = async (
  domain?: string
): Promise<Tenant | null> => {
  try {
    const tenants = await fetchTenants();
    const tenant = findTenantByDomain(tenants, domain);
    
    if (tenant) {
      // Store tenant config in localStorage for later use
      if (typeof window !== "undefined") {
        localStorage.setItem("tenantConfig", JSON.stringify(tenant));
        // Store tenantId separately for API calls (domain-based tenant)
        if (tenant.tenantId) {
          localStorage.setItem("domainTenantId", tenant.tenantId);
          console.log("[TenantService] Stored domain tenantId:", tenant.tenantId);
        }
      }
    }
    
    return tenant;
  } catch (error) {
    console.error("Error getting tenant config:", error);
    return null;
  }
};

/**
 * Gets stored tenant config from localStorage
 */
export const getStoredTenantConfig = (): Tenant | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem("tenantConfig");
    if (stored) {
      return JSON.parse(stored) as Tenant;
    }
  } catch (error) {
    console.error("Error parsing stored tenant config:", error);
  }

  return null;
};

/**
 * Gets the first content filter from tenant params
 */
export const getTenantContentFilter = (tenant: Tenant | null): TenantContentFilter | null => {
  if (!tenant?.params?.contentFilter || !Array.isArray(tenant.params.contentFilter)) {
    return null;
  }

  return tenant.params.contentFilter[0] || null;
};

/**
 * Gets language-specific text from tenant configuration
 * Supports both string and Record<string, string> formats
 * @param text - Text value (string or language object)
 * @param currentLanguage - Current language code (e.g., "en", "hi")
 * @param fallback - Fallback text if not found
 * @returns The text in current language, fallback, or empty string
 */
export const getLocalizedText = (
  text: string | Record<string, string> | undefined,
  currentLanguage = "en",
  fallback = ""
): string => {
  if (!text) return fallback;
  
  // If it's already a string, return it
  if (typeof text === "string") {
    return text;
  }
  
  // If it's an object, try to get the current language
  if (typeof text === "object") {
    // Try exact match first
    if (text[currentLanguage]) {
      return text[currentLanguage];
    }
    
    // Try lowercase match
    const lowerLang = currentLanguage.toLowerCase();
    if (text[lowerLang]) {
      return text[lowerLang];
    }
    
    // Fallback to English
    if (text["en"] || text["EN"]) {
      return text["en"] || text["EN"];
    }
    
    // Fallback to first available language
    const firstKey = Object.keys(text)[0];
    if (firstKey) {
      return text[firstKey];
    }
  }
  
  return fallback;
};

