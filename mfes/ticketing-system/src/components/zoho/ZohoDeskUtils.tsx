import { SupportAgent, ConfirmationNumber, Close } from "@mui/icons-material";
import { CircularProgress, Fab } from "@mui/material";
import React, { useEffect, useCallback, useState } from "react";

/**
 * Interface for individual auto-populate field configuration
 */
interface AutoPopulateField {
  [fieldName: string]: {
    defaultValue: string | number | boolean;
    isHidden?: boolean;
  };
}

/**
 * Interface for auto-populate fields organized by department and layout ID
 */
interface AutoPopulateFields {
  [departmentAndLayoutId: string]: AutoPopulateField;
}

/**
 * Props interface for ZohoDeskTicketing component
 */
interface ZohoDeskTicketingProps {
  nonce?: string;
  autoPopulateFields?: AutoPopulateFields;
  showOpenButton?: boolean;
  showSubmitTicketButton?: boolean;
  onAppOpen?: () => void;
  onAppClose?: () => void;
  customButtonStyles?: React.CSSProperties;
  buttonPosition?: "top-right" | "bottom-right" | "bottom-left" | "top-left";
}

/**
 * Generate a random nonce for CSP compliance
 */
const crypto = require("crypto");
const defaultNonce = crypto.randomBytes(16).toString("base64");

/**
 * ZohoDeskTicketing Component
 *
 * A React component that integrates Zoho Desk ASAP widget with customizable buttons
 * and auto-populate functionality for seamless ticket creation.
 *
 * @param props - Component props
 * @returns React component with Zoho Desk integration
 */
const ZohoDeskTicketing: React.FC<ZohoDeskTicketingProps> = ({
  nonce = defaultNonce,
  autoPopulateFields,
  showOpenButton = true,
  showSubmitTicketButton = true,
  onAppOpen,
  onAppClose,
  customButtonStyles,
  buttonPosition = "bottom-right",
}) => {
  // Component state
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  // Environment variables for Zoho configuration
  const NEXT_PUBLIC_ZOHO_WIDGET_ID = process.env.NEXT_PUBLIC_ZOHO_WIDGET_ID;
  const NEXT_PUBLIC_ZOHO_ORG_ID = process.env.NEXT_PUBLIC_ZOHO_ORG_ID;
  const NEXT_PUBLIC_ZOHO_DEPT_ID = process.env.NEXT_PUBLIC_ZOHO_DEPT_ID;
  const NEXT_PUBLIC_ZOHO_LAYOUT_ID = process.env.NEXT_PUBLIC_ZOHO_LAYOUT_ID;
  const NEXT_PUBLIC_ZOHO_PORTAL_URL =
    process.env.NEXT_PUBLIC_ZOHO_PORTAL_URL || "https://desk.zoho.in";

  // Construct Zoho script URL
  const src = `${NEXT_PUBLIC_ZOHO_PORTAL_URL}/portal/api/web/asapApp/${NEXT_PUBLIC_ZOHO_WIDGET_ID}?orgId=${NEXT_PUBLIC_ZOHO_ORG_ID}`;

  /**
   * Close the Zoho Desk widget
   */
  const closeWidget = useCallback(() => {
    if (
      isWidgetReady &&
      (window as any).ZohoDeskAsap &&
      typeof (window as any).ZohoDeskAsap.invoke === "function"
    ) {
      (window as any).ZohoDeskAsap.invoke("close");
      setIsWidgetOpen(false);
      onAppClose?.();
    } else {
      console.warn("Zoho Desk ASAP widget is not ready or not properly loaded");
    }
  }, [isWidgetReady, onAppClose]);

  /**
   * Open the Zoho Desk widget
   */
  const openWidget = useCallback(() => {
    if (
      isWidgetReady &&
      (window as any).ZohoDeskAsap &&
      typeof (window as any).ZohoDeskAsap.invoke === "function"
    ) {
      (window as any).ZohoDeskAsap.invoke("open");
      setIsWidgetOpen(true);
      onAppOpen?.();
    } else {
      console.warn("Zoho Desk ASAP widget is not ready or not properly loaded");
    }
  }, [isWidgetReady, onAppOpen]);

  /**
   * Open submit ticket form directly with department and layout parameters
   */
  const openSubmitTicketForm = useCallback(() => {
    if (
      isWidgetReady &&
      (window as any).ZohoDeskAsap &&
      typeof (window as any).ZohoDeskAsap.invoke === "function"
    ) {
      const params: any = {};
      if (NEXT_PUBLIC_ZOHO_DEPT_ID)
        params.departmentId = NEXT_PUBLIC_ZOHO_DEPT_ID;
      if (NEXT_PUBLIC_ZOHO_LAYOUT_ID)
        params.layoutId = NEXT_PUBLIC_ZOHO_LAYOUT_ID;

      // Open widget first
      (window as any).ZohoDeskAsap.invoke("open");

      // Navigate to ticket form after widget opens
      setTimeout(() => {
        if (
          (window as any).ZohoDeskAsap &&
          typeof (window as any).ZohoDeskAsap.invoke === "function"
        ) {
          (window as any).ZohoDeskAsap.invoke("routeTo", {
            page: "ticket.form",
            parameters: params,
          });
        }
      }, 500);

      setIsWidgetOpen(true);
      onAppOpen?.();
    } else {
      console.warn("Zoho Desk ASAP widget is not ready or not properly loaded");
    }
  }, [
    isWidgetReady,
    NEXT_PUBLIC_ZOHO_DEPT_ID,
    NEXT_PUBLIC_ZOHO_LAYOUT_ID,
    onAppOpen,
  ]);

  /**
   * Initialize Zoho Desk ASAP widget
   */
  useEffect(() => {
    // Validate required environment variables
    if (!NEXT_PUBLIC_ZOHO_WIDGET_ID || !NEXT_PUBLIC_ZOHO_ORG_ID) {
      console.error("Missing required Zoho environment variables:", {
        WIDGET_ID: NEXT_PUBLIC_ZOHO_WIDGET_ID,
        ORG_ID: NEXT_PUBLIC_ZOHO_ORG_ID,
      });
      return;
    }

    // Prevent duplicate script loading
    if (document.getElementById("zohodeskasapscript")) {
      return;
    }

    // Create and configure script element
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.id = "zohodeskasapscript";
    script.defer = true;
    script.nonce = nonce;
    script.src = src;

    // Handle script loading events
    script.onerror = (error) => {
      console.error("Failed to load Zoho Desk ASAP script:", error);
      console.error("Script URL:", src);
    };

    script.onload = () => {
      console.log("Zoho Desk ASAP script loaded successfully");
    };

    // Setup Zoho widget ready handler
    (window as any).ZohoDeskAsapReady = function (callback: () => void) {
      const asyncCalls = ((window as any).ZohoDeskAsap__asyncalls =
        (window as any).ZohoDeskAsap__asyncalls || []);

      if ((window as any).ZohoDeskAsapReadyStatus) {
        if (callback) asyncCalls.push(callback);
        asyncCalls.forEach((cb: () => void) => cb && cb());
        (window as any).ZohoDeskAsap__asyncalls = null;
      } else if (callback) {
        asyncCalls.push(callback);
      }
    };

    // Initialize widget when ready
    (window as any).ZohoDeskAsapReady(() => {
      console.log("Zoho Desk ASAP widget ready, initializing...");
      setIsWidgetReady(true);

      if ((window as any).ZohoDeskAsap) {
        // Setup event handlers
        (window as any).ZohoDeskAsap.on("onAppOpen", () => {
          setIsWidgetOpen(true);
          // Update global state for SpeedDial
          window.zohoDeskWidgetOpen = true;
          if (window.zohoDeskWidgetStateListeners) {
            window.zohoDeskWidgetStateListeners.forEach((listener) =>
              listener(true)
            );
          }
          onAppOpen?.();
        });

        (window as any).ZohoDeskAsap.on("onAppClose", () => {
          setIsWidgetOpen(false);
          // Update global state for SpeedDial
          window.zohoDeskWidgetOpen = false;
          if (window.zohoDeskWidgetStateListeners) {
            window.zohoDeskWidgetStateListeners.forEach((listener) =>
              listener(false)
            );
          }
          onAppClose?.();
        });

        // Configure auto-populate fields
        if (
          autoPopulateFields &&
          typeof (window as any).ZohoDeskAsap.set === "function"
        ) {
          (window as any).ZohoDeskAsap.set(
            "ticket.form.prefillValues",
            autoPopulateFields
          );
        }
      } else {
        console.error("ZohoDeskAsap object not available after ready callback");
      }
    });

    // Insert script into document
    const firstScript = document.getElementsByTagName("script")[0];
    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    }

    // Cleanup function
    return () => {
      const scriptElement = document.getElementById("zohodeskasapscript");
      if (scriptElement?.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }

      // Clean up global variables
      delete (window as any).ZohoDeskAsapReady;
      delete (window as any).ZohoDeskAsap__asyncalls;
      delete (window as any).ZohoDeskAsapReadyStatus;
    };
  }, [
    nonce,
    NEXT_PUBLIC_ZOHO_WIDGET_ID,
    NEXT_PUBLIC_ZOHO_ORG_ID,
    autoPopulateFields,
    onAppOpen,
    onAppClose,
    src,
  ]);

  // Show loading state while widget initializes
  if (!isWidgetReady) {
    return (
      <Fab
        color="primary"
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
      >
        <CircularProgress size={24} sx={{ color: "white" }} />
      </Fab>
    );
  }

  // Render appropriate buttons based on widget state and configuration
  return (
    <>
      {showSubmitTicketButton ? (
        <Fab
          color="primary"
          onClick={isWidgetOpen ? closeWidget : openSubmitTicketForm}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
        >
          {isWidgetOpen ? <Close /> : <ConfirmationNumber />}
        </Fab>
      ) : (
        showOpenButton && (
          <Fab
            color="primary"
            onClick={isWidgetOpen ? closeWidget : openWidget}
            sx={{
              position: "fixed",
              bottom: 24,
              right: 24,
              zIndex: 1000,
            }}
          >
            {isWidgetOpen ? <Close /> : <SupportAgent />}
          </Fab>
        )
      )}
    </>
  );
};

const ZohoDeskTickets = () => {
  return <></>;
};

/**
 * Utility functions for external Zoho Desk widget control
 */
export const ZohoDeskUtils = {
  /**
   * Check if Zoho Desk widget is available and ready
   */
  isAvailable: () => {
    return (
      !!(window as any).ZohoDeskAsap &&
      typeof (window as any).ZohoDeskAsap.invoke === "function"
    );
  },

  /**
   * Check if Zoho Desk widget is currently open
   */
  isOpen: () => {
    if (!ZohoDeskUtils.isAvailable()) {
      return false;
    }

    // Try to detect if widget is open by checking DOM elements
    const zohoIframe =
      document.querySelector('iframe[src*="zoho"]') ||
      document.querySelector('iframe[src*="desk"]') ||
      document.querySelector('[id*="zohodesk"]') ||
      document.querySelector('[class*="zohodesk"]') ||
      document.querySelector('[id*="asap"]') ||
      document.querySelector('[class*="asap"]');

    if (zohoIframe) {
      const iframe = zohoIframe as HTMLElement;
      return (
        iframe.style.display !== "none" &&
        iframe.offsetHeight > 0 &&
        iframe.offsetWidth > 0
      );
    }

    return false;
  },

  /**
   * Open the Zoho Desk widget
   */
  openWidget: () => {
    if (ZohoDeskUtils.isAvailable()) {
      (window as any).ZohoDeskAsap.invoke("open");
    } else {
      console.warn(
        "Zoho Desk ASAP widget is not available or not properly loaded"
      );
    }
  },

  /**
   * Close the Zoho Desk widget
   */
  closeWidget: () => {
    if (ZohoDeskUtils.isAvailable()) {
      (window as any).ZohoDeskAsap.invoke("close");
    } else {
      console.warn(
        "Zoho Desk ASAP widget is not available or not properly loaded"
      );
    }
  },

  /**
   * Hide the widget launcher
   */
  hideLauncher: () => {
    if (ZohoDeskUtils.isAvailable()) {
      (window as any).ZohoDeskAsap.invoke("hide", "app.launcher");
    } else {
      console.warn(
        "Zoho Desk ASAP widget is not available or not properly loaded"
      );
    }
  },

  /**
   * Show the widget launcher
   */
  showLauncher: () => {
    if (ZohoDeskUtils.isAvailable()) {
      (window as any).ZohoDeskAsap.invoke("show", "app.launcher");
    } else {
      console.warn(
        "Zoho Desk ASAP widget is not available or not properly loaded"
      );
    }
  },

  /**
   * Open submit ticket form with optional department and layout IDs
   */
  openSubmitTicketForm: (departmentId?: string, layoutId?: string) => {
    if (ZohoDeskUtils.isAvailable()) {
      const params: any = {};
      if (departmentId) params.departmentId = departmentId;
      if (layoutId) params.layoutId = layoutId;

      (window as any).ZohoDeskAsap.invoke("open");

      setTimeout(() => {
        (window as any).ZohoDeskAsap.invoke("routeTo", {
          page: "ticket.form",
          parameters: params,
        });
      }, 500);
    } else {
      console.warn(
        "Zoho Desk ASAP widget is not available or not properly loaded"
      );
    }
  },

  /**
   * Navigate directly to ticket form (widget must be open)
   */
  routeToTicketForm: (departmentId?: string, layoutId?: string) => {
    if (ZohoDeskUtils.isAvailable()) {
      const params: any = {};
      if (departmentId) params.departmentId = departmentId;
      if (layoutId) params.layoutId = layoutId;

      (window as any).ZohoDeskAsap.invoke("routeTo", {
        page: "ticket.form",
        parameters: params,
      });
    } else {
      console.warn(
        "Zoho Desk ASAP widget is not available or not properly loaded"
      );
    }
  },

  /**
   * Set auto-populate fields for ticket forms
   */
  setAutoPopulateFields: (fields: AutoPopulateFields) => {
    if (
      (window as any).ZohoDeskAsap &&
      typeof (window as any).ZohoDeskAsap.set === "function"
    ) {
      (window as any).ZohoDeskAsap.set("ticket.form.prefillValues", fields);
    } else {
      console.warn(
        "Zoho Desk ASAP widget is not available or not properly loaded"
      );
    }
  },

  /**
   * Add event listener for widget state changes
   */
  onWidgetOpen: (callback: () => void) => {
    if (ZohoDeskUtils.isAvailable()) {
      try {
        if (typeof (window as any).ZohoDeskAsap.on === "function") {
          (window as any).ZohoDeskAsap.on("onAppOpen", callback);
        } else {
          console.warn("ZohoDeskAsap.on is not available");
        }
      } catch (error) {
        console.warn("Error setting up onWidgetOpen listener:", error);
      }
    }
  },

  /**
   * Add event listener for widget close events
   */
  onWidgetClose: (callback: () => void) => {
    if (ZohoDeskUtils.isAvailable()) {
      try {
        if (typeof (window as any).ZohoDeskAsap.on === "function") {
          (window as any).ZohoDeskAsap.on("onAppClose", callback);
        } else {
          console.warn("ZohoDeskAsap.on is not available");
        }
      } catch (error) {
        console.warn("Error setting up onWidgetClose listener:", error);
      }
    }
  },

  /**
   * Setup event listeners safely using ZohoDeskAsapReady
   */
  setupEventListeners: (onOpen?: () => void, onClose?: () => void) => {
    const setupListeners = () => {
      if (onOpen) ZohoDeskUtils.onWidgetOpen(onOpen);
      if (onClose) ZohoDeskUtils.onWidgetClose(onClose);
    };

    if (typeof (window as any).ZohoDeskAsapReady === "function") {
      (window as any).ZohoDeskAsapReady(() => {
        setupListeners();
      });
    } else {
      // Try immediately and with delays
      setupListeners();
      setTimeout(setupListeners, 1000);
      setTimeout(setupListeners, 3000);
    }
  },
};

// Export types for external use
export type { AutoPopulateField, AutoPopulateFields, ZohoDeskTicketingProps };

// Export SpeedDial component
export { ZohoDeskSpeedDial } from "./ZohoDeskSpeedDial";

export default ZohoDeskTicketing;
