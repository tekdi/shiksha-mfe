import React from "react";
import { Box, Typography, Divider, Alert } from "@mui/material";
import { ZohoOAuthButton } from "./CreateToken";

/**
 * Demo component showing different usage patterns of ZohoOAuthButton
 */
export const ZohoOAuthButtonDemo: React.FC = () => {
  const handleBeforeRedirect = () => {
    console.log("About to redirect to Zoho OAuth...");
  };

  const handleError = (error: Error) => {
    console.error("OAuth Error:", error);
    alert(`OAuth Error: ${error.message}`);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800 }}>
      <Typography variant="h4" gutterBottom>
        Zoho OAuth Integration
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        OAuth flow for accessing Zoho Desk APIs with proper authentication. This
        demonstrates the complete OAuth process including authorization, code
        exchange, and token management.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>OAuth Flow Steps:</strong>
          <br />
          1. Click the OAuth button to start authorization
          <br />
          2. You&apos;ll be redirected to Zoho&apos;s consent page
          <br />
          3. Grant permissions to your application
          <br />
          4. Get redirected back with authorization code
          <br />
          5. Exchange code for access token (use Token Generator)
        </Typography>
      </Alert>

      <Typography variant="body1" color="text.secondary" paragraph>
        Various examples of the reusable ZohoOAuthButton component:
      </Typography>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Basic Usage */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Login OAuth for Read
          </Typography>
          <ZohoOAuthButton
            label="Login OAuth for Read"
            scope="Desk.basic.READ"
            variant="contained"
          />
        </Box>

        {/* Different Scopes */}
        <Typography variant="h6" gutterBottom>
          Different Scopes
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {[
            { label: "ALL", key: "Desk.tickets.ALL" },
            { label: "READ", key: "Desk.basic.READ" },
            { label: "CREATE", key: "Desk.basic.CREATE" },
            { label: "UPDATE", key: "Desk.basic.UPDATE" },
            { label: "DELETE", key: "Desk.basic.DELETE" },
          ].map((scope) => {
            return (
              <Box key={scope.key}>
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <ZohoOAuthButton
                    label={scope.label}
                    variant="contained"
                    scope={scope.key}
                  />
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Custom Scope */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Custom OAuth Scope
          </Typography>
          <ZohoOAuthButton
            label="Access All Desk Data"
            scope="Desk.tickets.ALL,Desk.basic.READ"
            variant="contained"
            color="success"
          />
        </Box>

        {/* With Callbacks */}
        <Box>
          <Typography variant="h6" gutterBottom>
            With Event Callbacks
          </Typography>
          <ZohoOAuthButton
            label="OAuth with Callbacks"
            onBeforeRedirect={handleBeforeRedirect}
            onError={handleError}
            variant="contained"
            color="info"
          />
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="body2" color="text.secondary">
        <strong>Note:</strong> Make sure to set the NEXT_PUBLIC_ZOHO_CLIENT_ID
        environment variable or pass the clientId prop for the component to work
        properly.
      </Typography>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Configuration Requirements:
        </Typography>
        <Typography variant="body2" component="div">
          <ul>
            <li>ZOHO_CLIENT_ID - Your Zoho application client ID</li>
            <li>ZOHO_CLIENT_SECRET - Your Zoho application client secret</li>
            <li>ZOHO_REDIRECT_URI - Configured redirect URI</li>
            <li>ZOHO_SCOPE - Required API scopes (e.g., Desk.tickets.READ)</li>
          </ul>
        </Typography>
      </Box>
    </Box>
  );
};

export default ZohoOAuthButtonDemo;
