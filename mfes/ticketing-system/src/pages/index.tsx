import React, { useState, useCallback, useMemo } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
  Tabs,
  Tab,
} from "@mui/material";
import { SupportAgent, Close } from "@mui/icons-material";
import ZohoDeskTicketing from "../components/zoho/ZohoDeskUtils";
import ZohoOAuthButtonDemo from "../components/zoho/ZohoOAuthButtonDemo";
import { TokenGenerator } from "../components/zoho/TokenGenerator";
import { SpeedDialExample } from "../components/examples/SpeedDialExample";
import { SpeedDialTest } from "../components/examples/SpeedDialTest";
import { TicketListTest } from "../components/examples/TicketListTest";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ZohoTicketingDemo: React.FC = () => {
  // Simple state management
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    category: "",
    priority: "medium",
    subject: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
    ticketId?: string;
  } | null>(null);

  // Mock user data
  const mockUser = useMemo(
    () => ({
      name: "sagar Doe",
      email: "sagar_t@techjoomla.com",
      phone: "+1234567890",
    }),
    []
  );

  // Categories and priorities - memoized to prevent re-renders
  const categories = useMemo(
    () => [
      { id: "technical", label: "Technical Issues" },
      { id: "content", label: "Content Related" },
      { id: "account", label: "Account Issues" },
      { id: "course", label: "Course Access" },
    ],
    []
  );

  const priorities = useMemo(
    () => [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
      { value: "urgent", label: "Urgent" },
    ],
    []
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Submit ticket directly to API (no redirect fallback)
  const handleAPISubmit = useCallback(async () => {
    setSubmitting(true);
    setSubmitResult(null);

    try {
      const payload = {
        ...formData,
        ...mockUser,
        appName: "Demo App",
        ticketId: `DEMO-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };

      console.log("Submitting ticket:", payload);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSubmitResult({
        success: true,
        message: "Ticket submitted successfully!",
        ticketId: payload.ticketId,
      });

      // Reset form
      setFormData({
        category: "",
        priority: "medium",
        subject: "",
        description: "",
      });
    } catch (error) {
      setSubmitResult({
        success: false,
        message: "Failed to submit ticket. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }, [formData, mockUser]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom textAlign="center">
        Zoho Desk Integration Demo
      </Typography>

      <Alert severity="info" sx={{ mb: 4 }}>
        This demo showcases the Zoho Desk ticketing system integration with
        multiple components and features.
      </Alert>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="Zoho Desk Demo Tabs"
        >
          <Tab label="LOGIN OAuth" />
          <Tab label="SpeedDial Demo" />
          <Tab label="SpeedDial Test" />
          <Tab label="Ticket List Test" />
          <Tab label="Widget Integration" />
          <Tab label="Token Generator" />
        </Tabs>
      </Box>
      {/* Login OAuth - Separate Tab */}
      <TabPanel value={tabValue} index={0}>
        <ZohoOAuthButtonDemo />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <SpeedDialExample />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <SpeedDialTest />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <TicketListTest />
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        {/* Existing widget content */}
        <Grid container spacing={4}>
          {/* Widget Demo */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, height: "100%" }}>
              <Typography variant="h5" gutterBottom>
                Zoho Widget Integration
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Interactive Zoho Desk ASAP widget with auto-populate fields and
                event handlers.
              </Typography>

              <Alert severity="warning" sx={{ mb: 2 }}>
                Make sure to configure environment variables for Zoho Desk
                integration.
              </Alert>

              <ZohoDeskTicketing
                showOpenButton={false}
                showSubmitTicketButton={false}
              />
            </Paper>
          </Grid>

          {/* Manual Form Demo */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, height: "100%" }}>
              <Typography variant="h5" gutterBottom>
                Manual Ticket Form
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Fallback form for direct API submission when widget is not
                available.
              </Typography>

              <Button
                variant="contained"
                startIcon={<SupportAgent />}
                onClick={() => setIsFormOpen(true)}
                sx={{ mb: 2 }}
              >
                Open Ticket Form
              </Button>

              {submitResult && (
                <Alert
                  severity={submitResult.success ? "success" : "error"}
                  sx={{ mt: 2 }}
                >
                  {submitResult.message}
                  {submitResult.ticketId && (
                    <Typography variant="caption" display="block">
                      Ticket ID: {submitResult.ticketId}
                    </Typography>
                  )}
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        {/* Token Generator - Separate Tab */}
        <Container maxWidth="md">
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom>
              Access Token Generator
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Generate and manage Zoho Desk access tokens for API integration.
              This tool helps you convert OAuth authorization codes into access
              tokens.
            </Typography>

            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Important:</strong> Access tokens are required for API
                calls. Make sure you have completed the OAuth flow first to get
                an authorization code.
              </Typography>
            </Alert>

            <TokenGenerator />

            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Token Management Tips:
              </Typography>
              <Typography variant="body2" component="div">
                <ul>
                  <li>Access tokens typically expire after 1 hour</li>
                  <li>Use refresh tokens to get new access tokens</li>
                  <li>Store tokens securely in environment variables</li>
                  <li>Never expose tokens in client-side code</li>
                </ul>
              </Typography>
            </Box>
          </Paper>
        </Container>
      </TabPanel>

      {/* Manual Form Dialog */}
      <Dialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Submit Support Ticket</Typography>
            <IconButton onClick={() => setIsFormOpen(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                >
                  {priorities.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            User Information:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Name: {mockUser.name}
            <br />
            Email: {mockUser.email}
            <br />
            Phone: {mockUser.phone}
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsFormOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAPISubmit}
            disabled={
              submitting ||
              !formData.subject ||
              !formData.description ||
              !formData.category
            }
          >
            {submitting ? "Submitting..." : "Submit Ticket"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ZohoTicketingDemo;
