import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Collapse,
} from "@mui/material";
import {
  Close,
  ConfirmationNumber,
  Refresh,
  ExpandMore,
  FilterList,
  ExpandLess,
} from "@mui/icons-material";
import { useTicketList } from "../../hooks/useTicketList";

interface TicketListPopupProps {
  open: boolean;
  onClose: () => void;
}

const getStatusColor = (
  status: string
):
  | "default"
  | "primary"
  | "secondary"
  | "error"
  | "info"
  | "success"
  | "warning" => {
  switch (status.toLowerCase()) {
    case "open":
      return "primary";
    case "in progress":
    case "in-progress":
      return "warning";
    case "resolved":
    case "closed":
      return "success";
    case "on hold":
    case "on-hold":
      return "secondary";
    default:
      return "default";
  }
};

const getPriorityColor = (
  priority: string
):
  | "default"
  | "primary"
  | "secondary"
  | "error"
  | "info"
  | "success"
  | "warning" => {
  switch (priority.toLowerCase()) {
    case "urgent":
      return "error";
    case "high":
      return "warning";
    case "medium":
      return "primary";
    case "low":
      return "secondary";
    default:
      return "default";
  }
};

const formatDate = (dateString: string): string => {
  try {
    if (!dateString) return "N/A";

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "N/A";
    }

    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return "N/A";
  }
};

const shouldShowPriority = (priority: string): boolean => {
  return !!(
    priority &&
    priority.trim() !== "" &&
    priority.toLowerCase() !== "none"
  );
};

// Filter options
const PRIORITY_OPTIONS = [
  { value: "", label: "All Priorities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "open", label: "Open" },
  { value: "on hold", label: "On Hold" },
  { value: "closed", label: "Closed" },
];

export const TicketListPopup: React.FC<TicketListPopupProps> = ({
  open,
  onClose,
}) => {
  const [filters, setFilters] = useState({
    priority: "",
    status: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const {
    tickets,
    loading,
    error,
    hasMore,
    totalRecords,
    fetchTickets,
    loadMore,
    refresh,
  } = useTicketList({
    limit: 10,
    autoFetch: false,
    filters,
  });

  useEffect(() => {
    if (open && tickets.length === 0 && !loading && !error) {
      console.log("Fetching initial tickets...");
      fetchTickets();
    }
  }, [open, fetchTickets, tickets.length, loading, error]);

  const handleRefresh = () => {
    console.log("Refreshing tickets...");
    refresh();
  };

  const handleLoadMore = () => {
    console.log("Loading more tickets...", { hasMore, loading });
    if (hasMore && !loading) {
      loadMore();
    }
  };

  const handleFilterChange = (
    filterType: "priority" | "status",
    value: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      priority: "",
      status: "",
    });
  };

  const hasActiveFilters = filters.priority !== "" || filters.status !== "";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: "80vh",
          height: "auto",
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <ConfirmationNumber color="primary" />
            <Typography variant="h6">My Tickets</Typography>
            {totalRecords > 0 && (
              <Chip
                label={`${tickets.length} of ${totalRecords}`}
                size="small"
                variant="outlined"
                color="primary"
              />
            )}
            {hasActiveFilters && (
              <Chip
                label="Filtered"
                size="small"
                variant="filled"
                color="secondary"
              />
            )}
            {process.env.NODE_ENV === "development" && (
              <Chip
                label={`hasMore: ${hasMore}`}
                size="small"
                variant="outlined"
                color={hasMore ? "success" : "default"}
              />
            )}
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton
              onClick={() => setShowFilters(!showFilters)}
              size="small"
              color={hasActiveFilters ? "primary" : "default"}
            >
              <FilterList />
            </IconButton>
            <IconButton onClick={handleRefresh} disabled={loading} size="small">
              <Refresh />
            </IconButton>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      {/* Filter Section */}
      <Collapse in={showFilters}>
        <Box sx={{ px: 3, pb: 2 }}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Filters
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority}
                  label="Priority"
                  onChange={(e) =>
                    handleFilterChange("priority", e.target.value)
                  }
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                size="small"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
              >
                Clear
              </Button>
            </Stack>
          </Paper>
        </Box>
      </Collapse>

      <DialogContent dividers sx={{ padding: 0, minHeight: "300px" }}>
        {error && (
          <Box p={2}>
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={handleRefresh}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          </Box>
        )}

        {loading && tickets.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="200px"
          >
            <CircularProgress />
          </Box>
        ) : tickets.length === 0 && !loading ? (
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            minHeight="200px"
            p={3}
          >
            <ConfirmationNumber
              sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No tickets found
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              You haven&apos;t created any tickets yet. Click the submit ticket
              button to create your first ticket.
            </Typography>
          </Box>
        ) : (
          <List sx={{ padding: 0 }}>
            {tickets.map((ticket, index) => (
              <React.Fragment key={ticket.id}>
                <ListItem sx={{ py: 2, px: 3 }}>
                  <ListItemIcon>
                    <ConfirmationNumber color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          #{ticket.ticketNumber}
                        </Typography>
                        <Chip
                          label={ticket.status}
                          size="small"
                          color={getStatusColor(ticket.status)}
                          variant="filled"
                        />
                        {shouldShowPriority(ticket.priority) && (
                          <Chip
                            label={ticket.priority}
                            size="small"
                            color={getPriorityColor(ticket.priority)}
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="body1"
                          sx={{ mb: 1, fontWeight: 500 }}
                        >
                          {ticket.subject}
                        </Typography>
                        {ticket.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              mb: 1,
                            }}
                          >
                            {ticket.description}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Created: {formatDate(ticket.createdTime)}
                          </Typography>
                        </Stack>
                      </Box>
                    }
                  />
                </ListItem>
                {index < tickets.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}

        {hasMore && tickets.length > 0 && (
          <Box display="flex" justifyContent="center" p={2}>
            <Button
              variant="outlined"
              onClick={handleLoadMore}
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={16} /> : <ExpandMore />
              }
              fullWidth
              sx={{ maxWidth: 200 }}
            >
              {loading
                ? "Loading..."
                : totalRecords > 0
                ? `Load More (${Math.max(
                    0,
                    totalRecords - tickets.length
                  )} remaining)`
                : "Load More"}
            </Button>
          </Box>
        )}

        {!hasMore && tickets.length > 0 && totalRecords > 0 && (
          <Box display="flex" justifyContent="center" p={2}>
            <Typography variant="body2" color="text.secondary">
              All {totalRecords} tickets loaded
            </Typography>
          </Box>
        )}

        {!hasMore && tickets.length > 0 && totalRecords === 0 && (
          <Box display="flex" justifyContent="center" p={2}>
            <Typography variant="body2" color="text.secondary">
              All tickets loaded
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
