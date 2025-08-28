import React from "react";
import { Box, Typography, Divider, Paper, Button } from "@mui/material";
import { TokenGenerator } from "./TokenGenerator";
import { useRouter } from "next/router";
/**
 * Demo component showing different usage patterns of TokenGenerator
 */
export const TokenGeneratorDemo: React.FC = () => {
  const router = useRouter();
  return (
    <Box sx={{ p: 3, maxWidth: 1000 }}>
      <Button
        onClick={() => {
          router.push("/");
        }}
      >
        Go to Home
      </Button>
      <Typography variant="h4" gutterBottom>
        Token Generator Demo
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Various examples of the reusable TokenGenerator component:
      </Typography>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Detailed Response */}
        <Paper sx={{ p: 3 }} elevation={2}>
          <Typography variant="h6" gutterBottom>
            Detailed Response View
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Shows all token details including refresh token, API domain, etc.
          </Typography>
          <TokenGenerator
            label="Generate Detailed Token"
            variant="contained"
            color="secondary"
            size="large"
            showDetailedResponse={true}
          />
        </Paper>

        {/* Refresh Token Mode */}
        <Paper sx={{ p: 3 }} elevation={2}>
          <Typography variant="h6" gutterBottom>
            Refresh Token Mode
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Use refresh_token grant type instead of authorization_code
          </Typography>

          <TokenGenerator
            label="Refresh Access Token"
            variant="outlined"
            color="secondary"
            grantType="refresh_token"
          />
        </Paper>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Paper sx={{ p: 3, backgroundColor: "grey.50" }} elevation={1}>
        <Typography variant="subtitle2" gutterBottom>
          Usage Notes:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • The TokenGenerator component automatically detects authorization
          codes from URL query parameters
          <br />• It calls the `/base_path/api/auth/get-token` endpoint to
          exchange codes for access tokens
          <br />
          • Tokens are displayed in a formatted, copyable format
          <br />
          • The component handles loading states and error scenarios gracefully
          <br />
          • Use the `showDetailedResponse` prop to display additional token
          information
          <br />• Callback functions can be used to handle success and error
          cases programmatically
        </Typography>
      </Paper>
    </Box>
  );
};

export default TokenGeneratorDemo;
