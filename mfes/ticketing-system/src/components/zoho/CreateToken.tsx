import React from "react";
import { Button } from "@mui/material";
import { useRouter } from "next/router";

interface ZohoOAuthButtonProps {
  /**
   * Button text to display
   */
  label?: string;
  /**
   * Material-UI Button variant
   */
  variant?: "text" | "outlined" | "contained";
  /**
   * Material-UI Button size
   */
  size?: "small" | "medium" | "large";
  /**
   * Material-UI Button color
   */
  color?:
    | "inherit"
    | "primary"
    | "secondary"
    | "success"
    | "error"
    | "info"
    | "warning";
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
  /**
   * Custom class name for styling
   */
  className?: string;
  /**
   * Custom styles
   */
  style?: React.CSSProperties;
  /**
   * OAuth scope for Zoho Desk API
   */
  scope?: string;
  /**
   * OAuth access type
   */
  accessType?: "online" | "offline";
  /**
   * Custom redirect URI (defaults to callback endpoint)
   */
  redirectUri?: string;
  /**
   * Custom Zoho client ID (if not using environment variable)
   */
  clientId?: string;
  /**
   * Callback function triggered before redirect
   */
  onBeforeRedirect?: () => void;
  /**
   * Callback function triggered on redirect error
   */
  onError?: (error: Error) => void;
}

export const ZohoOAuthButton: React.FC<ZohoOAuthButtonProps> = ({
  label = "Open Tickets",
  variant = "contained",
  size = "medium",
  color = "primary",
  disabled = false,
  className,
  style,
  scope = "Desk.tickets.READ",
  accessType = "offline",
  redirectUri = process.env.NEXT_PUBLIC_ZOHO_REDIRECT_URI ||
    "http://localhost:4114/mfe_ticketing/callback",
  clientId,
  onBeforeRedirect,
  onError,
}) => {
  const router = useRouter();

  const handleOAuthRedirect = () => {
    try {
      // Get client ID from props or environment
      const zohoClientId = clientId || process.env.NEXT_PUBLIC_ZOHO_CLIENT_ID;
      const zohoAuthUrl =
        process.env.NEXT_PUBLIC_ZOHO_AUTH_URL || "https://accounts.zoho.in";

      if (!zohoClientId) {
        const error = new Error("Zoho Client ID is not configured");
        console.error("ZohoOAuthButton:", error.message);
        onError?.(error);
        return;
      }

      // Trigger callback before redirect
      onBeforeRedirect?.();

      // Build OAuth URL
      const oauthUrl = `${zohoAuthUrl}/oauth/v2/auth?scope=${encodeURIComponent(
        scope
      )}&client_id=${encodeURIComponent(
        zohoClientId
      )}&response_type=code&access_type=${encodeURIComponent(
        accessType
      )}&redirect_uri=${encodeURIComponent(redirectUri)}`;

      // Redirect to OAuth URL
      router.push(oauthUrl);
    } catch (error) {
      const authError =
        error instanceof Error ? error : new Error("OAuth redirect failed");
      console.error("ZohoOAuthButton: OAuth redirect error:", authError);
      onError?.(authError);
    }
  };

  return (
    <Button
      onClick={handleOAuthRedirect}
      variant={variant}
      size={size}
      color={color}
      disabled={disabled}
      className={className}
      style={style}
    >
      {label}
    </Button>
  );
};

export default ZohoOAuthButton;
