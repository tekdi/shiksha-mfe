import React, { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Alert,
  Stack,
  TextField,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

interface TestResponse {
  success: boolean;
  tickets: any[];
  totalRecords?: number;
  from?: number;
  limit?: number;
  hasMore?: boolean;
  method: string;
  message?: string;
}

export const TicketListTest: React.FC = () => {
  const [response, setResponse] = useState<TestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState("10");
  const [from, setFrom] = useState("0");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        from: from.toString(),
      });

      // Add filters if selected
      if (priority) {
        params.append("priority", priority);
      }
      if (status) {
        params.append("status", status);
      }

      console.log(`Testing API: /mfe_ticketing/api/tickets/list?${params}`);

      const apiResponse = await fetch(
        `/mfe_ticketing/api/tickets/list?${params}`
      );

      if (!apiResponse.ok) {
        throw new Error(
          `HTTP ${apiResponse.status}: ${apiResponse.statusText}`
        );
      }

      const data = await apiResponse.json();
      console.log("API Response:", data);
      setResponse(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("API Test Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const testPagination = () => {
    const nextFrom = response
      ? (parseInt(from) + response.tickets.length).toString()
      : "0";
    setFrom(nextFrom);
    setTimeout(testAPI, 100);
  };

  const reset = () => {
    setFrom("0");
    setPriority("");
    setStatus("");
    setResponse(null);
    setError(null);
  };

  const buildEndpointUrl = () => {
    const params = new URLSearchParams({
      limit,
      from,
    });
    if (priority) params.append("priority", priority);
    if (status) params.append("status", status);
    return `/mfe_ticketing/api/tickets/list?${params}`;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Ticket List API Test
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        This test helps debug the ticket list API endpoint, pagination, and
        filtering functionality.
      </Alert>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          API Test Parameters
        </Typography>

        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="Limit"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              size="small"
              type="number"
              inputProps={{ min: 1, max: 100 }}
            />

            <TextField
              label="From"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              size="small"
              type="number"
              inputProps={{ min: 0 }}
            />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priority}
                label="Priority"
                onChange={(e) => setPriority(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                label="Status"
                onChange={(e) => setStatus(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="on hold">On Hold</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="contained"
              onClick={testAPI}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : null}
            >
              {loading ? "Testing..." : "Test API"}
            </Button>

            <Button
              variant="outlined"
              onClick={testPagination}
              disabled={loading || !response || !response.hasMore}
            >
              Test Next Page
            </Button>

            <Button variant="text" onClick={reset}>
              Reset
            </Button>
          </Stack>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Endpoint: <code>{buildEndpointUrl()}</code>
        </Typography>
      </Paper>

      {error && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Alert severity="error">
            <Typography variant="h6">Error</Typography>
            <Typography variant="body2">{error}</Typography>
          </Alert>
        </Paper>
      )}

      {response && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            API Response
          </Typography>

          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2">Status:</Typography>
              <Typography
                color={response.success ? "success.main" : "error.main"}
              >
                {response.success ? "Success" : "Failed"}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2">Method:</Typography>
              <Typography>{response.method}</Typography>
            </Box>

            {response.message && (
              <Box>
                <Typography variant="subtitle2">Message:</Typography>
                <Typography>{response.message}</Typography>
              </Box>
            )}

            <Box>
              <Typography variant="subtitle2">Pagination Info:</Typography>
              <Typography component="div">
                • Tickets returned: {response.tickets.length}
                <br />• Total records: {response.totalRecords || "N/A"}
                <br />• From index: {response.from}
                <br />• Limit: {response.limit}
                <br />• Has more: {response.hasMore ? "Yes" : "No"}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2">Applied Filters:</Typography>
              <Typography component="div">
                • Priority: {priority || "All"}
                <br />• Status: {status || "All"}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2">Sample Tickets:</Typography>
              <Box
                component="pre"
                sx={{
                  backgroundColor: "#f5f5f5",
                  p: 2,
                  borderRadius: 1,
                  overflow: "auto",
                  fontSize: "0.75rem",
                  maxHeight: "300px",
                }}
              >
                {JSON.stringify(response.tickets.slice(0, 3), null, 2)}
                {response.tickets.length > 3 &&
                  "\n... and " + (response.tickets.length - 3) + " more"}
              </Box>
            </Box>
          </Stack>
        </Paper>
      )}

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Expected Behavior
        </Typography>
        <Typography variant="body2" component="div">
          <strong>For pagination to work correctly:</strong>
          <ul>
            <li>
              <code>hasMore</code> defaults to <code>true</code> initially
            </li>
            <li>
              API should return <code>hasMore: false</code> when this is the
              last page
            </li>
            <li>
              If API doesn&apos;t provide <code>hasMore</code>, it&apos;s
              calculated based on:
              <ul>
                <li>
                  No tickets returned → <code>hasMore: false</code>
                </li>
                <li>
                  Returned tickets &lt; limit → <code>hasMore: false</code>
                </li>
                <li>
                  Current total ≥ totalRecords → <code>hasMore: false</code>
                </li>
              </ul>
            </li>
            <li>
              <code>totalRecords</code> should show total number of tickets
            </li>
            <li>
              Each request should return up to <code>limit</code> tickets
            </li>
            <li>
              Next page should start from <code>from + returned_count</code>
            </li>
          </ul>

          <strong>For filtering to work correctly:</strong>
          <ul>
            <li>
              Priority filter should only return tickets with selected priority
            </li>
            <li>
              Status filter should only return tickets with selected status
            </li>
            <li>
              Filters can be combined (e.g., Priority=high AND Status=open)
            </li>
            <li>
              Empty filter values should return all tickets for that field
            </li>
            <li>
              Changing filters resets pagination (<code>hasMore: true</code>)
            </li>
          </ul>
        </Typography>
      </Paper>
    </Container>
  );
};
