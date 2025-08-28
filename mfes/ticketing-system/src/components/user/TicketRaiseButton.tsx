import React from "react";
import { Button, Fab, IconButton, Tooltip, Box } from "@mui/material";
import { SupportAgent } from "@mui/icons-material";
import { useTicketing } from "@/hooks/useTicketing";
import { TicketForm } from "./TicketForm";

interface TicketRaiseButtonProps {
  appName?: string;
  userRole?: string;
  placement?: "header" | "sidebar" | "floating" | "footer" | "dashboard";
  variant?: "primary" | "secondary" | "fab" | "icon";
  label?: string;
  icon?: React.ReactNode;
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const TicketRaiseButton: React.FC<TicketRaiseButtonProps> = ({
  appName,
  userRole,
  placement = "header",
  variant = "primary",
  label,
  icon,
  size = "medium",
  disabled = false,
  className,
  style,
}) => {
  const {
    canCreateTicket,
    isTicketCreationEnabled,
    openTicketForm,
    isTicketFormOpen,
    appConfig,
  } = useTicketing();

  // Don't render if user doesn't have permission or feature is disabled
  if (!canCreateTicket || !isTicketCreationEnabled) {
    return null;
  }

  const defaultLabel = label || "Raise Ticket";
  const defaultIcon = icon || <SupportAgent />;

  const handleClick = () => {
    openTicketForm();
  };

  // Render different variants based on placement and style
  const renderButton = () => {
    switch (variant) {
      case "fab":
        return (
          <Tooltip title={defaultLabel} placement="left">
            <Fab
              color="primary"
              size={size}
              onClick={handleClick}
              disabled={disabled}
              className={className}
              style={style}
              sx={{
                position: placement === "floating" ? "fixed" : "relative",
                bottom: placement === "floating" ? 24 : "auto",
                right: placement === "floating" ? 24 : "auto",
                zIndex: placement === "floating" ? 1000 : "auto",
              }}
            >
              {defaultIcon}
            </Fab>
          </Tooltip>
        );

      case "icon":
        return (
          <Tooltip title={defaultLabel}>
            <IconButton
              color="primary"
              size={size}
              onClick={handleClick}
              disabled={disabled}
              className={className}
              style={style}
            >
              {defaultIcon}
            </IconButton>
          </Tooltip>
        );

      case "secondary":
        return (
          <Button
            variant="outlined"
            startIcon={defaultIcon}
            size={size}
            onClick={handleClick}
            disabled={disabled}
            className={className}
            style={style}
            sx={{
              borderRadius: placement === "dashboard" ? 2 : 1,
              textTransform: "none",
              fontWeight: placement === "dashboard" ? 600 : 400,
            }}
          >
            {defaultLabel}
          </Button>
        );

      default: // primary
        return (
          <Button
            variant="contained"
            startIcon={defaultIcon}
            size={size}
            onClick={handleClick}
            disabled={disabled}
            className={className}
            style={style}
            sx={{
              borderRadius: placement === "dashboard" ? 2 : 1,
              textTransform: "none",
              fontWeight: placement === "dashboard" ? 600 : 500,
              boxShadow: placement === "header" ? 1 : 2,
            }}
          >
            {defaultLabel}
          </Button>
        );
    }
  };

  // Wrapper for different placements
  const renderWithPlacement = () => {
    switch (placement) {
      case "sidebar":
        return (
          <Box
            sx={{
              width: "100%",
              mb: 1,
            }}
          >
            {renderButton()}
          </Box>
        );

      case "dashboard":
        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            {renderButton()}
          </Box>
        );

      case "footer":
        return (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              p: 1,
            }}
          >
            {renderButton()}
          </Box>
        );

      default: // header, floating, or custom
        return renderButton();
    }
  };

  return (
    <>
      {renderWithPlacement()}
      {isTicketFormOpen && <TicketForm />}
    </>
  );
};

// Export named variants for easier integration
export const HeaderTicketButton: React.FC<
  Omit<TicketRaiseButtonProps, "placement">
> = (props) => <TicketRaiseButton {...props} placement="header" />;

export const SidebarTicketButton: React.FC<
  Omit<TicketRaiseButtonProps, "placement">
> = (props) => (
  <TicketRaiseButton {...props} placement="sidebar" variant="secondary" />
);

export const FloatingTicketButton: React.FC<
  Omit<TicketRaiseButtonProps, "placement" | "variant">
> = (props) => (
  <TicketRaiseButton {...props} placement="floating" variant="fab" />
);

export const DashboardTicketButton: React.FC<
  Omit<TicketRaiseButtonProps, "placement">
> = (props) => <TicketRaiseButton {...props} placement="dashboard" />;
