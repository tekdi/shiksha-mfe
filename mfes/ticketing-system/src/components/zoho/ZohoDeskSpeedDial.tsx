import React, { useState, useCallback, useEffect } from "react";
import {
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Backdrop,
  Box,
} from "@mui/material";
import { SupportAgent, List, Close, Add } from "@mui/icons-material";
import { TicketListPopup } from "../tickets/TicketListPopup";
import { ZohoDeskUtils } from "./ZohoDeskUtils";

interface ZohoDeskSpeedDialProps {
  /**
   * Position of the SpeedDial button
   */
  position?: {
    bottom?: number;
    right?: number;
    top?: number;
    left?: number;
  };
  /**
   * Show ticket list action
   */
  showTicketList?: boolean;
  /**
   * Show submit ticket action
   */
  showSubmitTicket?: boolean;
  /**
   * Callback when submit ticket is clicked
   */
  onSubmitTicket?: () => void;
  /**
   * Callback when ticket list is opened
   */
  onTicketListOpen?: () => void;
  /**
   * Custom styles for the SpeedDial
   */
  sx?: object;
  /**
   * Hide the backdrop when SpeedDial is open
   */
  hideBackdrop?: boolean;
}

// Global state for Zoho widget
declare global {
  interface Window {
    zohoDeskWidgetOpen?: boolean;
    zohoDeskWidgetStateListeners?: Array<(isOpen: boolean) => void>;
  }
}

export const ZohoDeskSpeedDial: React.FC<ZohoDeskSpeedDialProps> = ({
  position = { bottom: 24, right: 24 },
  showTicketList = true,
  showSubmitTicket = true,
  onSubmitTicket,
  onTicketListOpen,
  sx,
  hideBackdrop = false,
}) => {
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [ticketListOpen, setTicketListOpen] = useState(false);
  const [zohoWidgetOpen, setZohoWidgetOpen] = useState(false);

  // Initialize global state listeners
  useEffect(() => {
    if (!window.zohoDeskWidgetStateListeners) {
      window.zohoDeskWidgetStateListeners = [];
    }

    const handleStateChange = (isOpen: boolean) => {
      setZohoWidgetOpen(isOpen);
    };

    // Add this component's listener
    window.zohoDeskWidgetStateListeners.push(handleStateChange);

    // Set up Zoho widget event listeners using the safer utility method
    const handleWidgetOpen = () => {
      console.log("SpeedDial detected: Zoho widget opened");
      window.zohoDeskWidgetOpen = true;
      if (window.zohoDeskWidgetStateListeners) {
        window.zohoDeskWidgetStateListeners.forEach((listener) =>
          listener(true)
        );
      }
    };

    const handleWidgetClose = () => {
      console.log("SpeedDial detected: Zoho widget closed");
      window.zohoDeskWidgetOpen = false;
      if (window.zohoDeskWidgetStateListeners) {
        window.zohoDeskWidgetStateListeners.forEach((listener) =>
          listener(false)
        );
      }
    };

    // Use the safer setup method
    ZohoDeskUtils.setupEventListeners(handleWidgetOpen, handleWidgetClose);

    // Check initial state
    const initialState = window.zohoDeskWidgetOpen || false;
    setZohoWidgetOpen(initialState);

    // Cleanup
    return () => {
      if (window.zohoDeskWidgetStateListeners) {
        const index =
          window.zohoDeskWidgetStateListeners.indexOf(handleStateChange);
        if (index > -1) {
          window.zohoDeskWidgetStateListeners.splice(index, 1);
        }
      }
    };
  }, []);

  const handleSpeedDialToggle = useCallback(() => {
    setSpeedDialOpen((prev) => !prev);
  }, []);

  const handleSpeedDialClose = useCallback(() => {
    setSpeedDialOpen(false);
  }, []);

  const handleCloseZohoWidget = useCallback(() => {
    if (ZohoDeskUtils.isAvailable()) {
      ZohoDeskUtils.closeWidget();
      // Manually update state
      window.zohoDeskWidgetOpen = false;
      setZohoWidgetOpen(false);
      if (window.zohoDeskWidgetStateListeners) {
        window.zohoDeskWidgetStateListeners.forEach((listener) =>
          listener(false)
        );
      }
    }
    setSpeedDialOpen(false);
  }, []);

  const handleTicketListClick = useCallback(() => {
    // If Zoho widget is open, close it instead
    if (zohoWidgetOpen) {
      handleCloseZohoWidget();
      return;
    }

    // If ticket list popup is open, close the SpeedDial
    if (ticketListOpen) {
      setSpeedDialOpen(false);
      return;
    }

    setTicketListOpen(true);
    setSpeedDialOpen(false);
    onTicketListOpen?.();
  }, [ticketListOpen, zohoWidgetOpen, handleCloseZohoWidget, onTicketListOpen]);

  const handleSubmitTicketClick = useCallback(() => {
    // If Zoho widget is open, close it instead
    if (zohoWidgetOpen) {
      handleCloseZohoWidget();
      return;
    }

    // If ticket list popup is open, close the SpeedDial
    if (ticketListOpen) {
      setSpeedDialOpen(false);
      return;
    }

    // Use ZohoDeskUtils to open submit ticket form
    if (ZohoDeskUtils.isAvailable()) {
      ZohoDeskUtils.openSubmitTicketForm();
      // Update global state
      window.zohoDeskWidgetOpen = true;
      setZohoWidgetOpen(true);
      if (window.zohoDeskWidgetStateListeners) {
        window.zohoDeskWidgetStateListeners.forEach((listener) =>
          listener(true)
        );
      }
    } else {
      console.warn("Zoho Desk widget not available");
      // Fallback: call custom callback if provided
      onSubmitTicket?.();
    }

    setSpeedDialOpen(false);
  }, [ticketListOpen, zohoWidgetOpen, handleCloseZohoWidget, onSubmitTicket]);

  const handleTicketListClose = useCallback(() => {
    setTicketListOpen(false);
  }, []);

  // Define actions based on current state
  const actions = [];

  if (zohoWidgetOpen) {
    // When Zoho widget is open, show only close action
    actions.push({
      icon: <Close />,
      name: "Close Zoho Widget",
      onClick: handleCloseZohoWidget,
    });
  } else {
    // Normal state - show regular actions
    if (showTicketList) {
      actions.push({
        icon: <List />,
        name: "View Tickets",
        onClick: handleTicketListClick,
      });
    }

    if (showSubmitTicket) {
      actions.push({
        icon: <Add />,
        name: "Submit Ticket",
        onClick: handleSubmitTicketClick,
      });
    }
  }

  // Don't render if no actions are enabled
  if (actions.length === 0) {
    return null;
  }

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          ...position,
          zIndex: 1300,
          ...sx,
        }}
      >
        <SpeedDial
          ariaLabel="Zoho Desk Actions"
          icon={
            <SpeedDialIcon
              icon={zohoWidgetOpen ? <Close /> : <SupportAgent />}
              openIcon={<Close />}
            />
          }
          onClose={
            zohoWidgetOpen ? handleCloseZohoWidget : handleSpeedDialClose
          }
          onOpen={
            zohoWidgetOpen ? handleCloseZohoWidget : handleSpeedDialToggle
          }
          open={speedDialOpen}
          direction="up"
        >
          {actions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.onClick}
              FabProps={{
                size: "small",
                color: zohoWidgetOpen ? "secondary" : "primary",
              }}
            />
          ))}
        </SpeedDial>
      </Box>

      {/* Backdrop to close SpeedDial when clicking outside */}
      {!hideBackdrop && (
        <Backdrop
          open={speedDialOpen}
          onClick={handleSpeedDialClose}
          sx={{
            zIndex: 1250,
            backgroundColor: "transparent",
          }}
        />
      )}

      {/* Ticket List Popup */}
      <TicketListPopup open={ticketListOpen} onClose={handleTicketListClose} />
    </>
  );
};
