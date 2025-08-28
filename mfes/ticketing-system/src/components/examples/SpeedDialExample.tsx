import React from "react";
import { Container, Typography, Box, Alert } from "@mui/material";
import { ZohoDeskSpeedDial } from "../zoho/ZohoDeskSpeedDial";
import ZohoDeskTicketing from "../zoho/ZohoDeskUtils";

/**
 * Example component demonstrating the ZohoDeskSpeedDial usage
 */
export const SpeedDialExample: React.FC = () => {
  const handleSubmitTicket = () => {
    console.log("Submit ticket fallback triggered");
    // Fallback logic when Zoho widget is not available
    alert(
      "Zoho Desk widget is not available. Please configure your Zoho settings."
    );
  };

  const handleTicketListOpen = () => {
    console.log("Ticket list opened");
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Zoho Desk SpeedDial Demo
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        The SpeedDial component provides quick access to ticket operations:
        <br />• <strong>View Tickets</strong>: Shows a popup with your ticket
        list, pagination, and load more functionality
        <br />• <strong>Submit Ticket</strong>: Opens the Zoho Desk ticket
        submission form
        <br />• <strong>Smart Behavior</strong>: If a popup is open, clicking
        the SpeedDial will close it
        <br />• <strong>Zoho Widget Integration</strong>: When Zoho widget is
        open, SpeedDial shows only a close button to close the widget
      </Alert>

      <Box
        sx={{
          position: "relative",
          height: "400px",
          border: "1px dashed #ccc",
          borderRadius: 2,
          p: 2,
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Main content area. The SpeedDial will appear in the bottom-right
          corner.
        </Typography>

        <Typography variant="body2" sx={{ mt: 2 }}>
          Features:
        </Typography>
        <ul>
          <li>Click the SpeedDial to see available actions</li>
          <li>
            Click &quot;View Tickets&quot; to see your ticket list with
            pagination
          </li>
          <li>Click &quot;Submit Ticket&quot; to open the Zoho ticket form</li>
          <li>If a popup is open, the SpeedDial will close it on click</li>
          <li>When Zoho widget is open, SpeedDial shows only close button</li>
          <li>
            Uses the API endpoint `/api/tickets/list` for fetching tickets
          </li>
        </ul>

        {/* Initialize Zoho Desk Widget */}
        <ZohoDeskTicketing
          showOpenButton={false}
          showSubmitTicketButton={false}
        />

        {/* SpeedDial Component */}
        <ZohoDeskSpeedDial
          showTicketList={true}
          showSubmitTicket={true}
          onSubmitTicket={handleSubmitTicket}
          onTicketListOpen={handleTicketListOpen}
          position={{ bottom: 24, right: 24 }}
        />
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Usage Example:
        </Typography>
        <Box
          component="pre"
          sx={{
            backgroundColor: "#f5f5f5",
            padding: 2,
            borderRadius: 1,
            overflow: "auto",
            fontSize: "0.875rem",
          }}
        >
          {`import { ZohoDeskSpeedDial } from '@/components/zoho/ZohoDeskSpeedDial';

// Basic usage
<ZohoDeskSpeedDial />

// With custom configuration
<ZohoDeskSpeedDial
  showTicketList={true}
  showSubmitTicket={true}
  position={{ bottom: 24, right: 24 }}
  onSubmitTicket={() => console.log('Submit ticket')}
  onTicketListOpen={() => console.log('Ticket list opened')}
/>`}
        </Box>
      </Box>
    </Container>
  );
};
