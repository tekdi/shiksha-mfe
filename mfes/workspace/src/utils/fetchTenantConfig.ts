export interface LogoConfig {
  sidebar: string;
  login: string;
  favicon: string;
  alt: string;
}

export interface TenantConfig {
  CHANNEL_ID: string;
  CONTENT_FRAMEWORK: string;
  COLLECTION_FRAMEWORK: string;
  LOGO_CONFIG?: LogoConfig; // ✅ Optional if not all tenants have this
}

/**
 * Fetches Tenant Configuration dynamically.
 * - Supports both client & server environments
 * - Accepts `tenantId` explicitly (optional)
 */
export const fetchTenantConfig = async (
  tenantId?: string,
  req?: any
): Promise<TenantConfig | null> => {
  try {
    const resolvedTenantId = tenantId;

    if (!resolvedTenantId) {
      console.error("Tenant ID is required but not found");
      return null;
    }

    // Fetch from API with the tenantId
    const response = await fetch(`/api/tenantConfig?tenantId=${resolvedTenantId}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) throw new Error("Tenant not found");

    // ✅ Parse the full config including LOGO_CONFIG
    const data = await response.json();

    // Return full structure safely
    return {
      CHANNEL_ID: data.CHANNEL_ID,
      CONTENT_FRAMEWORK: data.CONTENT_FRAMEWORK,
      COLLECTION_FRAMEWORK: data.COLLECTION_FRAMEWORK,
      LOGO_CONFIG: data.LOGO_CONFIG,
    };
  } catch (error) {
    console.error("Error fetching tenant config:", error);
    return null;
  }
};
