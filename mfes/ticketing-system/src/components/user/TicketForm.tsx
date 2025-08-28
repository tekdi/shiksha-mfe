import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  LinearProgress,
  Alert,
  IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { useTicketing } from "@/hooks/useTicketing";
import { TicketFormData } from "@/types/ticket.types";
import { PRIORITY_OPTIONS } from "@/utils/constants";

export const TicketForm: React.FC = () => {
  const {
    isTicketFormOpen,
    closeTicketForm,
    createTicket,
    currentUser,
    categories,
    isLoading,
    error,
    clearError,
  } = useTicketing();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TicketFormData>({
    defaultValues: {
      category: "",
      subject: "",
      description: "",
      priority: "medium",
    },
  });

  useEffect(() => {
    if (isTicketFormOpen) {
      console.log("Ticket form opened - resetting form");
      reset();
      clearError();
    }
  }, [isTicketFormOpen, reset, clearError]);

  const onSubmit = async (data: TicketFormData) => {
    if (!currentUser) {
      console.error("No current user found");
      return;
    }

    console.log("Submitting ticket form with data:", data);

    const ticketData = {
      userId: currentUser.userId,
      username: currentUser.username,
      email: currentUser.email,
      phone: currentUser.phone,
      subject: data.subject,
      description: data.description,
      category: data.category,
      priority: data.priority,
    };

    console.log("Final ticket submission data:", ticketData);
    await createTicket(ticketData);
  };

  const handleClose = () => {
    console.log("Closing ticket form");
    closeTicketForm();
    reset();
    clearError();
  };

  if (!currentUser) {
    console.log("TicketForm - No current user, not rendering");
    return null;
  }

  console.log(
    "TicketForm - About to render Dialog with open:",
    isTicketFormOpen
  );

  return (
    <Dialog
      open={isTicketFormOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: 600,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Typography variant="h6" component="div">
          Raise Support Ticket
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading && <LinearProgress sx={{ mb: 2 }} />}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* User Information Display */}
          <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Contact Information
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Name:</strong> {currentUser.username}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Email:</strong> {currentUser.email}
            </Typography>
            {currentUser.phone && (
              <Typography variant="body2" color="text.secondary">
                <strong>Phone:</strong> {currentUser.phone}
              </Typography>
            )}
          </Box>

          {/* Category Selection */}
          <Controller
            name="category"
            control={control}
            rules={{ required: "Please select a category" }}
            render={({ field }) => (
              <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.category}>
                <InputLabel>Category</InputLabel>
                <Select {...field} label="Category">
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ mt: 0.5, ml: 1 }}
                  >
                    {errors.category.message}
                  </Typography>
                )}
              </FormControl>
            )}
          />

          {/* Priority Selection */}
          <Controller
            name="priority"
            control={control}
            rules={{ required: "Please select a priority" }}
            render={({ field }) => (
              <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.priority}>
                <InputLabel>Priority</InputLabel>
                <Select {...field} label="Priority">
                  {PRIORITY_OPTIONS.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.priority && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ mt: 0.5, ml: 1 }}
                  >
                    {errors.priority.message}
                  </Typography>
                )}
              </FormControl>
            )}
          />

          {/* Subject Field */}
          <Controller
            name="subject"
            control={control}
            rules={{
              required: "Subject is required",
              maxLength: {
                value: 200,
                message: "Subject must be less than 200 characters",
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Subject"
                placeholder="Brief description of your issue"
                error={!!errors.subject}
                helperText={errors.subject?.message}
                sx={{ mb: 2 }}
              />
            )}
          />

          {/* Description Field */}
          <Controller
            name="description"
            control={control}
            rules={{
              required: "Description is required",
              minLength: {
                value: 10,
                message: "Please provide more details (at least 10 characters)",
              },
              maxLength: {
                value: 2000,
                message: "Description must be less than 2000 characters",
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                multiline
                rows={6}
                label="Description"
                placeholder="Please provide detailed information about your issue, including steps to reproduce if applicable..."
                error={!!errors.description}
                helperText={errors.description?.message}
                sx={{ mb: 2 }}
              />
            )}
          />

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 2 }}
          >
            After clicking &quot;Submit Ticket&quot;, you will be redirected to
            Zoho Desk to complete your submission. Your information has been
            pre-filled for your convenience.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={isLoading}
          sx={{ minWidth: 120 }}
        >
          {isLoading ? "Submitting..." : "Submit Ticket"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
