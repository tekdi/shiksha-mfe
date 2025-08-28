import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Alert,
  Stack,
  Chip,
} from "@mui/material";
import { ZohoDeskSpeedDial } from "../zoho/ZohoDeskSpeedDial";

/**
 * Test component to verify SpeedDial behavior with manual Zoho widget state control
 */
export const SpeedDialTest: React.FC = () => {
  const [zohoWidgetOpen, setZohoWidgetOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    zohoDeskAsapAvailable: false,
    zohoDeskAsapReadyAvailable: false,
    onMethodAvailable: false,
    globalStateListeners: 0,
    globalStateOpen: false,
  });

  // Update debug info periodically
  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo({
        zohoDeskAsapAvailable: !!(window as any).ZohoDeskAsap,
        zohoDeskAsapReadyAvailable:
          typeof (window as any).ZohoDeskAsapReady === "function",
        onMethodAvailable:
          !!(window as any).ZohoDeskAsap &&
          typeof (window as any).ZohoDeskAsap.on === "function",
        globalStateListeners: window.zohoDeskWidgetStateListeners?.length || 0,
        globalStateOpen: window.zohoDeskWidgetOpen || false,
      });
    };

    // Update immediately and then every 2 seconds
    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleToggleZohoWidget = () => {
    const newState = !zohoWidgetOpen;
    setZohoWidgetOpen(newState);

    // Update global state to simulate Zoho widget
    window.zohoDeskWidgetOpen = newState;
    if (window.zohoDeskWidgetStateListeners) {
      window.zohoDeskWidgetStateListeners.forEach((listener) =>
        listener(newState)
      );
    }

    console.log(`Zoho widget ${newState ? "opened" : "closed"}`);
  };

  const handleSubmitTicket = () => {
    console.log("Submit ticket fallback triggered");
    alert("Zoho Desk widget is not available. This is the fallback action.");
  };

  const handleTicketListOpen = () => {
    console.log("Ticket list opened");
  };

  const handleTestRealZoho = () => {
    if (
      (window as any).ZohoDeskAsap &&
      typeof (window as any).ZohoDeskAsap.invoke === "function"
    ) {
      try {
        (window as any).ZohoDeskAsap.invoke("open");
        console.log("Attempted to open real Zoho widget");
      } catch (error) {
        console.error("Error opening Zoho widget:", error);
        alert("Error opening Zoho widget: " + error);
      }
    } else {
      alert(
        "Real Zoho widget is not available. Make sure ZohoDeskTicketing component is loaded."
      );
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        SpeedDial Test - Manual Zoho Widget Control
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        This test allows you to manually simulate the Zoho widget open/close
        state to verify that the SpeedDial responds correctly.
      </Alert>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Zoho Widget Debug Information
        </Typography>

        <Stack spacing={1} sx={{ mb: 2 }}>
          <Chip
            label={`ZohoDeskAsap Available: ${
              debugInfo.zohoDeskAsapAvailable ? "Yes" : "No"
            }`}
            color={debugInfo.zohoDeskAsapAvailable ? "success" : "error"}
            size="small"
          />
          <Chip
            label={`ZohoDeskAsapReady Available: ${
              debugInfo.zohoDeskAsapReadyAvailable ? "Yes" : "No"
            }`}
            color={debugInfo.zohoDeskAsapReadyAvailable ? "success" : "error"}
            size="small"
          />
          <Chip
            label={`on() Method Available: ${
              debugInfo.onMethodAvailable ? "Yes" : "No"
            }`}
            color={debugInfo.onMethodAvailable ? "success" : "error"}
            size="small"
          />
          <Chip
            label={`Global State Listeners: ${debugInfo.globalStateListeners}`}
            color={debugInfo.globalStateListeners > 0 ? "success" : "warning"}
            size="small"
          />
          <Chip
            label={`Global Widget State: ${
              debugInfo.globalStateOpen ? "Open" : "Closed"
            }`}
            color={debugInfo.globalStateOpen ? "success" : "default"}
            size="small"
          />
        </Stack>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Manual Zoho Widget State Control
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Button
            variant={zohoWidgetOpen ? "outlined" : "contained"}
            color={zohoWidgetOpen ? "secondary" : "primary"}
            onClick={handleToggleZohoWidget}
          >
            {zohoWidgetOpen ? "Close Zoho Widget" : "Open Zoho Widget"}
          </Button>

          <Button variant="outlined" color="info" onClick={handleTestRealZoho}>
            Test Real Zoho Widget
          </Button>

          <Chip
            label={zohoWidgetOpen ? "Widget Open" : "Widget Closed"}
            color={zohoWidgetOpen ? "success" : "default"}
            variant={zohoWidgetOpen ? "filled" : "outlined"}
          />
        </Stack>

        <Typography variant="body2" color="text.secondary">
          Current State: <strong>{zohoWidgetOpen ? "Open" : "Closed"}</strong>
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Expected SpeedDial Behavior:
        </Typography>

        <Typography variant="body2" component="div">
          <strong>When Zoho Widget is Closed:</strong>
          <ul>
            <li>SpeedDial shows support agent icon</li>
            <li>
              Two actions available: &quot;View Tickets&quot; and &quot;Submit
              Ticket&quot;
            </li>
            <li>Actions use primary color</li>
          </ul>

          <strong>When Zoho Widget is Open:</strong>
          <ul>
            <li>SpeedDial shows close icon</li>
            <li>Only one action available: &quot;Close Zoho Widget&quot;</li>
            <li>Action uses secondary color</li>
            <li>Clicking closes the widget</li>
          </ul>
        </Typography>
      </Paper>

      <Box
        sx={{
          position: "relative",
          height: "400px",
          border: "1px dashed #ccc",
          borderRadius: 2,
          p: 2,
          backgroundColor: "#f9f9f9",
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Main content area. The SpeedDial will appear in the bottom-right
          corner.
        </Typography>

        <Typography variant="body2" sx={{ mt: 2 }}>
          Test Steps:
        </Typography>
        <ol>
          <li>Check the SpeedDial in normal state (should show 2 actions)</li>
          <li>Click &quot;Open Zoho Widget&quot; button above</li>
          <li>SpeedDial should change to show only close action</li>
          <li>Click the close action in SpeedDial</li>
          <li>Widget should close and SpeedDial should return to normal</li>
          <li>
            Try &quot;Test Real Zoho Widget&quot; to test with actual Zoho
            integration
          </li>
        </ol>

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
          Debug Information:
        </Typography>
        <Typography
          variant="body2"
          component="pre"
          sx={{
            backgroundColor: "#f5f5f5",
            p: 2,
            borderRadius: 1,
            fontSize: "0.75rem",
          }}
        >
          {`Global State: ${JSON.stringify(
            {
              zohoDeskWidgetOpen: window.zohoDeskWidgetOpen,
              listenersCount: window.zohoDeskWidgetStateListeners?.length || 0,
            },
            null,
            2
          )}

Local State: ${JSON.stringify(
            {
              zohoWidgetOpen,
            },
            null,
            2
          )}

Zoho Widget Status: ${JSON.stringify(debugInfo, null, 2)}`}
        </Typography>
      </Box>
    </Container>
  );
};
