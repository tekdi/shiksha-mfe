import { NextApiRequest, NextApiResponse } from "next";

interface TokenResponse {
  success: boolean;
  access_token?: string;
  refresh_token?: string;
  api_domain?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  message: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TokenResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed. Use POST.",
    });
  }

  const {
    grant_type = "authorization_code",
    client_id = process.env.ZOHO_CLIENT_ID,
    client_secret = process.env.ZOHO_CLIENT_SECRET,
    redirect_uri = process.env.ZOHO_REDIRECT_URI,
    code,
    refresh_token,
  } = req.body;

  // Validate required parameters based on grant type
  if (grant_type === "authorization_code" && !code) {
    return res.status(400).json({
      success: false,
      message:
        "Authorization code is required for authorization_code grant type",
      error: "missing_code",
    });
  }

  if (grant_type === "refresh_token" && !refresh_token) {
    return res.status(400).json({
      success: false,
      message: "Refresh token is required for refresh_token grant type",
      error: "missing_refresh_token",
    });
  }

  try {
    // Prepare form data
    const formData = new URLSearchParams();
    formData.append("grant_type", grant_type);
    formData.append("client_id", client_id);
    formData.append("client_secret", client_secret);

    if (grant_type === "authorization_code") {
      formData.append("redirect_uri", redirect_uri);
      formData.append("code", code);
    } else if (grant_type === "refresh_token") {
      formData.append("refresh_token", refresh_token);
    }
    const zohoAuthUrl = process.env.ZOHO_AUTH_URL || "https://accounts.zoho.in";
    // Make request to Zoho (using .in domain as per your curl)
    const response = await fetch(`${zohoAuthUrl}/oauth/v2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        // Note: Cookies from curl are session-specific and typically not needed for API calls
      },
      body: formData.toString(),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Zoho token request failed:", {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      });

      return res.status(response.status).json({
        success: false,
        message: `Token request failed: ${
          responseData.error_description ||
          responseData.error ||
          "Unknown error"
        }`,
        error: responseData.error || "request_failed",
      });
    }

    if (responseData.error) {
      if (responseData.error === "invalid_code") {
        return res.status(400).json({
          success: false,
          message: "Invalid grant please go back and relogin and try again",
          error: "invalid_code",
        });
      }
      return res.status(400).json({
        success: false,
        message: responseData.error_description || responseData.error,
        error: responseData.error || "request_failed",
      });
    }
    // Success response
    return res.status(200).json({
      success: true,
      access_token: responseData.access_token,
      refresh_token: responseData.refresh_token,
      api_domain: responseData.api_domain,
      token_type: responseData.token_type,
      expires_in: responseData.expires_in,
      scope: responseData.scope,
      message: "Token retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting token:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while getting token",
      error: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
