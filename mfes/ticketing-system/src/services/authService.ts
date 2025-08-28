export interface ZohoAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  apiDomain?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  api_domain?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

export interface TokenInfo {
  accessToken: string;
  refreshToken?: string;
  apiDomain: string;
  expiresAt: number;
  scopes: string[];
}

export class ZohoAuthService {
  private config: ZohoAuthConfig;
  private baseUrl = "https://accounts.zoho.com";

  constructor(config: ZohoAuthConfig) {
    this.config = {
      apiDomain: "https://www.zohoapis.com",
      ...config,
    };
  }

  /**
   * Generate authorization URL for OAuth flow
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      scope: this.config.scopes.join(","),
      client_id: this.config.clientId,
      response_type: "code",
      redirect_uri: this.config.redirectUri,
      access_type: "offline",
      ...(state && { state }),
    });

    return `${this.baseUrl}/oauth/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(authCode: string): Promise<TokenInfo> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: "authorization_code",
      code: authCode,
      redirect_uri: this.config.redirectUri,
    });

    const response = await fetch(`${this.baseUrl}/oauth/v2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(
        `Token exchange failed: ${response.status} - ${errorData}`
      );
    }

    const tokenData: TokenResponse = await response.json();

    if (!tokenData.access_token) {
      throw new Error("No access token received from Zoho");
    }

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      apiDomain: tokenData.api_domain || this.config.apiDomain!,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
      scopes: this.config.scopes,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenInfo> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const response = await fetch(`${this.baseUrl}/oauth/v2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(
        `Token refresh failed: ${response.status} - ${errorData}`
      );
    }

    const tokenData: TokenResponse = await response.json();

    if (!tokenData.access_token) {
      throw new Error("No access token received during refresh");
    }

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshToken, // Keep old refresh token if new one not provided
      apiDomain: tokenData.api_domain || this.config.apiDomain!,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
      scopes: this.config.scopes,
    };
  }

  /**
   * Validate token by making a test API call
   */
  async validateToken(
    accessToken: string,
    apiDomain?: string
  ): Promise<boolean> {
    try {
      const domain = apiDomain || this.config.apiDomain;
      const response = await fetch(`${domain}/desk/api/v1/organizations`, {
        method: "GET",
        headers: {
          Authorization: `oauthtoken ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      return response.ok;
    } catch (error) {
      console.error("Token validation failed:", error);
      return false;
    }
  }

  /**
   * Get token info from Zoho
   */
  async getTokenInfo(accessToken: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/oauth/v2/token/info`, {
      method: "GET",
      headers: {
        Authorization: `oauthtoken ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get token info: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Revoke token
   */
  async revokeToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/oauth/v2/token/revoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `token=${token}`,
      });

      return response.ok;
    } catch (error) {
      console.error("Token revocation failed:", error);
      return false;
    }
  }
}

/**
 * Token Manager for handling token storage and automatic refresh
 */
export class ZohoTokenManager {
  private authService: ZohoAuthService;
  private storageKey = "zoho_token_info";
  private refreshThreshold = 5 * 60 * 1000; // Refresh 5 minutes before expiry

  constructor(authService: ZohoAuthService) {
    this.authService = authService;
  }

  /**
   * Store token info (in browser localStorage or server-side storage)
   */
  storeTokenInfo(tokenInfo: TokenInfo): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.storageKey, JSON.stringify(tokenInfo));
    }
    // For server-side, you might want to store in database or file system
  }

  /**
   * Get stored token info
   */
  getStoredTokenInfo(): TokenInfo | null {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (error) {
          console.error("Failed to parse stored token info:", error);
        }
      }
    }
    return null;
  }

  /**
   * Check if token needs refresh
   */
  needsRefresh(tokenInfo: TokenInfo): boolean {
    return Date.now() >= tokenInfo.expiresAt - this.refreshThreshold;
  }

  /**
   * Get valid access token (with automatic refresh if needed)
   */
  async getValidAccessToken(): Promise<string | null> {
    let tokenInfo = this.getStoredTokenInfo();

    if (!tokenInfo) {
      return null;
    }

    // Check if token needs refresh
    if (this.needsRefresh(tokenInfo) && tokenInfo.refreshToken) {
      try {
        console.log("Refreshing access token...");
        tokenInfo = await this.authService.refreshAccessToken(
          tokenInfo.refreshToken
        );
        this.storeTokenInfo(tokenInfo);
        console.log("Access token refreshed successfully");
      } catch (error) {
        console.error("Failed to refresh token:", error);
        this.clearStoredTokenInfo();
        return null;
      }
    }

    return tokenInfo.accessToken;
  }

  /**
   * Clear stored token info
   */
  clearStoredTokenInfo(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Initialize token from authorization code
   */
  async initializeFromCode(authCode: string): Promise<TokenInfo> {
    const tokenInfo = await this.authService.exchangeCodeForToken(authCode);
    this.storeTokenInfo(tokenInfo);
    return tokenInfo;
  }
}

/**
 * Default Zoho configuration for Desk API
 */
export const DEFAULT_ZOHO_CONFIG: ZohoAuthConfig = {
  clientId: process.env.ZOHO_CLIENT_ID || "1000.INCDKRWKFELMVX9JHAGSVBX1ENINTG",
  clientSecret:
    process.env.ZOHO_CLIENT_SECRET ||
    "b9fc446c6ba98d25b9f3c8afcbea06c604a8265f3d",
  redirectUri: process.env.ZOHO_REDIRECT_URI || "https://www.google.com",
  scopes: [
    "Desk.tickets.CREATE",
    "Desk.tickets.READ",
    "Desk.tickets.UPDATE",
    "Desk.contacts.CREATE",
    "Desk.contacts.READ",
    "Desk.contacts.UPDATE",
    "Desk.basic.READ",
  ],
  apiDomain: "https://www.zohoapis.com",
};

/**
 * Create default auth service instance
 */
export const createZohoAuthService = (config?: Partial<ZohoAuthConfig>) => {
  return new ZohoAuthService({ ...DEFAULT_ZOHO_CONFIG, ...config });
};

/**
 * Create default token manager instance
 */
export const createZohoTokenManager = (config?: Partial<ZohoAuthConfig>) => {
  const authService = createZohoAuthService(config);
  return new ZohoTokenManager(authService);
};

/**
 * Utility function to get current access token from environment or token manager
 */
export const getCurrentAccessToken = async (): Promise<string | null> => {
  // First try environment variable (for server-side)
  if (process.env.ZOHO_ACCESS_TOKEN) {
    return process.env.ZOHO_ACCESS_TOKEN;
  }

  // Then try token manager (for client-side)
  if (typeof window !== "undefined") {
    const tokenManager = createZohoTokenManager();
    return await tokenManager.getValidAccessToken();
  }

  return null;
};
