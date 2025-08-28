import React, { useState, useCallback, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  TextField,
  InputAdornment,
} from "@mui/material";
import { useRouter } from "next/router";
import { VpnKey, ContentCopy, CheckCircle, Refresh } from "@mui/icons-material";

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

interface TokenGeneratorProps {
  /** Custom button label */
  label?: string;
  /** Button variant */
  variant?: "contained" | "outlined" | "text";
  /** Button size */
  size?: "small" | "medium" | "large";
  /** Button color */
  color?: "primary" | "secondary" | "success" | "error" | "info" | "warning";
  /** Disabled state */
  disabled?: boolean;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Custom grant type (default: authorization_code) */
  grantType?: "authorization_code" | "refresh_token";
  /** Callback after successful token generation */
  onSuccess?: (tokenData: TokenResponse) => void;
  /** Callback on error */
  onError?: (error: string) => void;
  /** Show detailed response including refresh token */
  showDetailedResponse?: boolean;
}

export const TokenGenerator: React.FC<TokenGeneratorProps> = ({
  label = "Generate Token",
  variant = "contained",
  size = "medium",
  color = "primary",
  disabled = false,
  className,
  style,
  grantType = "authorization_code",
  onSuccess,
  onError,
  showDetailedResponse = false,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tokenData, setTokenData] = useState<TokenResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [refreshTokenInput, setRefreshTokenInput] = useState<string>("");

  // Get code from query params
  const { code } = router.query;

  // Check if we have the required code parameter
  const hasCode = Boolean(code && typeof code === "string");

  // Determine if we should show refresh token input
  const shouldShowRefreshTokenInput =
    grantType === "refresh_token" && !tokenData;

  // Check if we can generate token
  const canGenerateToken =
    grantType === "authorization_code"
      ? hasCode
      : refreshTokenInput.trim().length > 0;

  const handleGenerateToken = useCallback(async () => {
    if (grantType === "authorization_code" && !hasCode) {
      const errorMsg = "Authorization code not found in URL parameters";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    if (grantType === "refresh_token" && !refreshTokenInput.trim()) {
      const errorMsg = "Refresh token is required";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);
    setTokenData(null);

    try {
      const requestBody: any = {
        grant_type: grantType,
      };

      if (grantType === "authorization_code") {
        requestBody.code = code;
      } else {
        requestBody.refresh_token = refreshTokenInput.trim();
      }

      const response = await fetch("/mfe_ticketing/api/auth/get-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data: TokenResponse = await response.json();

      if (data.success) {
        setTokenData(data);
        onSuccess?.(data);
      } else {
        const errorMsg = data.message || "Failed to generate token";
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Network error";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [hasCode, code, grantType, refreshTokenInput, onSuccess, onError]);

  const handleCopy = useCallback(async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  }, []);

  const handleRefreshTokenChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRefreshTokenInput(event.target.value);
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const RenderTokenField = ({
    label,
    value,
    fieldKey,
  }: {
    label: string;
    value: string | undefined;
    fieldKey: string;
  }) => {
    // Save token value to localStorage when it changes
    useEffect(() => {
      localStorage.setItem(`zoho_${fieldKey}`, value || "");
    }, [value, fieldKey]);

    if (!value) return null;

    return (
      <Box key={fieldKey} sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {label}:
          </Typography>
          <Chip
            size="small"
            icon={
              copiedField === fieldKey ? (
                <CheckCircle sx={{ fontSize: 16 }} />
              ) : (
                <ContentCopy sx={{ fontSize: 16 }} />
              )
            }
            label={copiedField === fieldKey ? "Copied!" : "Copy"}
            onClick={() => handleCopy(value, fieldKey)}
            color={copiedField === fieldKey ? "success" : "default"}
            variant="outlined"
          />
        </Box>
        <Paper
          elevation={1}
          sx={{
            p: 2,
            backgroundColor: "grey.50",
            border: "1px solid",
            borderColor: "grey.200",
            borderRadius: 1,
          }}
        >
          <Typography
            component="pre"
            sx={{
              fontFamily: "monospace",
              fontSize: "0.875rem",
              wordBreak: "break-all",
              whiteSpace: "pre-wrap",
              margin: 0,
            }}
          >
            {value}
          </Typography>
        </Paper>
      </Box>
    );
  };

  // Get appropriate button label
  const getButtonLabel = () => {
    if (loading) return "Generating...";
    if (grantType === "refresh_token") {
      return label === "Generate Token" ? "Refresh Access Token" : label;
    }
    return label;
  };

  // Get appropriate button icon
  const getButtonIcon = () => {
    if (loading) {
      return <CircularProgress size={20} color="inherit" />;
    }
    if (grantType === "refresh_token") {
      return <Refresh />;
    }
    return <VpnKey />;
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3, textAlign: "center" }}>
        {grantType === "refresh_token" ? (
          <Refresh sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
        ) : (
          <VpnKey sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
        )}
        <Typography variant="h5" gutterBottom>
          {grantType === "refresh_token"
            ? "Token Refresher"
            : "Token Generator"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {grantType === "refresh_token"
            ? "Refresh your access token using a refresh token"
            : "Generate access tokens using OAuth authorization code"}
        </Typography>
      </Box>

      {/* Status Information */}
      <Box sx={{ mb: 3 }}>
        {grantType === "authorization_code" && !hasCode && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No authorization code found in URL. Make sure you&apos;ve completed
            the OAuth flow and have a &apos;code&apos; parameter in your URL.
          </Alert>
        )}

        {grantType === "authorization_code" &&
          hasCode &&
          !tokenData &&
          !error && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Authorization code detected. Ready to generate token.
            </Alert>
          )}

        {grantType === "refresh_token" && !tokenData && !error && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Enter your refresh token below to generate a new access token.
          </Alert>
        )}
      </Box>

      {/* Refresh Token Input Field */}
      {shouldShowRefreshTokenInput && (
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Refresh Token"
            placeholder="Enter your refresh token here..."
            value={refreshTokenInput}
            onChange={handleRefreshTokenChange}
            multiline
            rows={3}
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <VpnKey color="action" />
                </InputAdornment>
              ),
            }}
            helperText="Paste your refresh token to generate a new access token"
          />
        </Box>
      )}

      {/* Generate Token Button */}
      <Box sx={{ mb: 3, textAlign: "center" }}>
        <Button
          onClick={handleGenerateToken}
          variant={variant}
          size={size}
          color={color}
          disabled={disabled || loading || !canGenerateToken}
          className={className}
          style={style}
          startIcon={getButtonIcon()}
        >
          {getButtonLabel()}
        </Button>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}

      {/* Success Response */}
      {tokenData && tokenData.success && (
        <Box>
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body2">{tokenData.message}</Typography>
          </Alert>

          {/* Access Token (Always shown) */}
          <RenderTokenField
            label="Access Token"
            value={tokenData.access_token}
            fieldKey="access_token"
          />

          {/* Detailed Response Fields */}
          {showDetailedResponse && (
            <>
              <RenderTokenField
                label="Refresh Token"
                value={tokenData.refresh_token}
                fieldKey="refresh_token"
              />
              <RenderTokenField
                label="API Domain"
                value={tokenData.api_domain}
                fieldKey="api_domain"
              />
              {tokenData.token_type && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Token Type: {tokenData.token_type}
                  </Typography>
                </Box>
              )}
              {tokenData.expires_in && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Expires In: {tokenData.expires_in} seconds
                  </Typography>
                </Box>
              )}
              {tokenData.scope && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Scope: {tokenData.scope}
                  </Typography>
                </Box>
              )}
            </>
          )}

          {/* Option to refresh again */}
          {grantType === "refresh_token" && (
            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setTokenData(null);
                  setRefreshTokenInput("");
                  setError(null);
                }}
                startIcon={<Refresh />}
              >
                Refresh Another Token
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* Usage Instructions */}
      <Paper sx={{ p: 2, mt: 3, backgroundColor: "grey.50" }}>
        <Typography variant="subtitle2" gutterBottom>
          Usage Instructions:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {grantType === "refresh_token" ? (
            <>
              1. Paste your refresh token in the input field above
              <br />
              2. Click &quot;Refresh Access Token&quot; to get a new access
              token
              <br />
              3. Copy the new access token to use with Zoho APIs
              <br />
              4. The refresh token can be reused multiple times until it expires
            </>
          ) : (
            <>
              1. Complete the OAuth flow to get an authorization code
              <br />
              2. The code should appear as a &apos;code&apos; parameter in your
              URL
              <br />
              3. Click the &quot;Generate Token&quot; button to exchange the
              code for tokens
              <br />
              4. Copy the access token to use with Zoho APIs
            </>
          )}
        </Typography>
      </Paper>
    </Box>
  );
};

export default TokenGenerator;
