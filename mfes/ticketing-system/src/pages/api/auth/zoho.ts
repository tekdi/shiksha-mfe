import { NextApiRequest, NextApiResponse } from "next";
import {
  createZohoAuthService,
  createZohoTokenManager,
  DEFAULT_ZOHO_CONFIG,
} from "../../../services/authService";

interface AuthUrlResponse {
  success: boolean;
  authUrl: string;
  message: string;
}

interface TokenResponse {
  success: boolean;
  accessToken: string;
  refreshToken?: string;
  apiDomain: string;
  expiresAt: number;
  message: string;
}

interface TokenValidationResponse {
  success: boolean;
  isValid: boolean;
  tokenInfo?: any;
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    | AuthUrlResponse
    | TokenResponse
    | TokenValidationResponse
    | { error: string; [key: string]: any }
  >
) {
  const { method, query } = req;

  try {
    const authService = createZohoAuthService();
    const tokenManager = createZohoTokenManager();

    switch (method) {
      case "GET":
        return handleGetRequest(req, res, authService, tokenManager);
      case "POST":
        return handlePostRequest(req, res, authService, tokenManager);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Auth API error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function handleGetRequest(
  req: NextApiRequest,
  res: NextApiResponse,
  authService: any,
  tokenManager: any
) {
  const { action, state } = req.query;

  switch (action) {
    case "auth-url": {
      // Generate authorization URL
      const authUrl = authService.getAuthorizationUrl(state as string);
      return res.status(200).json({
        success: true,
        authUrl,
        message: "Authorization URL generated successfully",
      });
    }

    case "validate": {
      // Validate current token
      const currentToken = await tokenManager.getValidAccessToken();
      if (!currentToken) {
        return res.status(200).json({
          success: true,
          isValid: false,
          message: "No valid token found",
        });
      }

      const isValid = await authService.validateToken(currentToken);
      let tokenInfo = null;

      if (isValid) {
        try {
          tokenInfo = await authService.getTokenInfo(currentToken);
        } catch (error) {
          console.warn("Could not fetch token info:", error);
        }
      }

      return res.status(200).json({
        success: true,
        isValid,
        tokenInfo,
        message: isValid ? "Token is valid" : "Token is invalid or expired",
      });
    }

    case "token-info": {
      // Get detailed token information
      const storedTokenInfo = tokenManager.getStoredTokenInfo();
      if (!storedTokenInfo) {
        return res.status(404).json({
          success: false,
          message: "No token information found",
        });
      }

      return res.status(200).json({
        success: true,
        ...storedTokenInfo,
        message: "Token information retrieved successfully",
      });
    }

    default:
      return res.status(400).json({
        error: "Invalid action",
        message: "Supported actions: auth-url, validate, token-info",
      });
  }
}

async function handlePostRequest(
  req: NextApiRequest,
  res: NextApiResponse,
  authService: any,
  tokenManager: any
) {
  const { action } = req.query;
  const { code, refreshToken } = req.body;

  switch (action) {
    case "exchange": {
      // Exchange authorization code for tokens
      if (!code) {
        return res.status(400).json({
          error: "Missing authorization code",
          message: "Authorization code is required",
        });
      }

      try {
        const tokenInfo = await tokenManager.initializeFromCode(code);
        return res.status(200).json({
          success: true,
          accessToken: tokenInfo.accessToken,
          refreshToken: tokenInfo.refreshToken,
          apiDomain: tokenInfo.apiDomain,
          expiresAt: tokenInfo.expiresAt,
          message: "Token exchange successful",
        });
      } catch (error) {
        console.error("Token exchange error:", error);
        return res.status(400).json({
          error: "Token exchange failed",
          message: error instanceof Error ? error.message : "Unknown error",
          troubleshooting: {
            checkCode: "Verify the authorization code is valid and not expired",
            checkConfig: "Ensure client ID and secret are correct",
            checkRedirectUri:
              "Verify redirect URI matches the one used in authorization",
          },
        });
      }
    }

    case "refresh": {
      // Refresh access token
      if (!refreshToken) {
        return res.status(400).json({
          error: "Missing refresh token",
          message: "Refresh token is required",
        });
      }

      try {
        const tokenInfo = await authService.refreshAccessToken(refreshToken);
        tokenManager.storeTokenInfo(tokenInfo);

        return res.status(200).json({
          success: true,
          accessToken: tokenInfo.accessToken,
          refreshToken: tokenInfo.refreshToken,
          apiDomain: tokenInfo.apiDomain,
          expiresAt: tokenInfo.expiresAt,
          message: "Token refresh successful",
        });
      } catch (error) {
        console.error("Token refresh error:", error);
        return res.status(400).json({
          error: "Token refresh failed",
          message: error instanceof Error ? error.message : "Unknown error",
          troubleshooting: {
            checkRefreshToken: "Verify the refresh token is valid",
            checkConfig: "Ensure client ID and secret are correct",
            reauthorize:
              "If refresh continues to fail, re-authorize the application",
          },
        });
      }
    }

    case "revoke": {
      // Revoke token
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({
          error: "Missing token",
          message: "Token to revoke is required",
        });
      }

      try {
        const success = await authService.revokeToken(token);
        if (success) {
          tokenManager.clearStoredTokenInfo();
        }

        return res.status(200).json({
          success,
          message: success
            ? "Token revoked successfully"
            : "Token revocation failed",
        });
      } catch (error) {
        console.error("Token revocation error:", error);
        return res.status(500).json({
          error: "Token revocation failed",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    case "clear": {
      // Clear stored token information
      tokenManager.clearStoredTokenInfo();
      return res.status(200).json({
        success: true,
        message: "Token information cleared successfully",
      });
    }

    default:
      return res.status(400).json({
        error: "Invalid action",
        message: "Supported actions: exchange, refresh, revoke, clear",
      });
  }
}
