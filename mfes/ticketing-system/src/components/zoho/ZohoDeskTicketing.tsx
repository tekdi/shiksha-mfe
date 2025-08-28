import React from "react";
import ZohoDeskTicketing, { ZohoDeskUtils } from "./ZohoDeskUtils";

/**
 * Props interface for ZohoDeskTicketingExample component
 */
interface ZohoDeskTicketingExampleProps {
  /** Type of button to display */
  buttonType?: string;
  /** Static data for auto-populating form fields */
  staticData?: Record<string, any>;
  /** Array of field names that should be hidden from user */
  isHidden?: string[];
  /** Show documentation */
  isShowDoc?: boolean;
}

/**
 * ZohoDeskTicketingExample Component
 *
 * A comprehensive example component that demonstrates various use cases
 * of the ZohoDeskTicketing widget with different button configurations
 * and auto-populate field functionality.
 *
 * @param props - Component props
 * @returns React component with Zoho Desk integration examples
 */
const ZohoDeskTicketingExample: React.FC<ZohoDeskTicketingExampleProps> = ({
  buttonType = "",
  staticData = {},
  isHidden = [],
  isShowDoc = false,
}) => {
  // Environment variables for Zoho configuration
  const NEXT_PUBLIC_ZOHO_DEPT_ID = process.env.NEXT_PUBLIC_ZOHO_DEPT_ID;
  const NEXT_PUBLIC_ZOHO_LAYOUT_ID = process.env.NEXT_PUBLIC_ZOHO_LAYOUT_ID;

  /**
   * Generate auto-populate fields configuration from static data
   */
  const exampleAutoPopulateFields = {
    [`${NEXT_PUBLIC_ZOHO_DEPT_ID}&&&${NEXT_PUBLIC_ZOHO_LAYOUT_ID}`]:
      Object.keys(staticData).reduce((acc: Record<string, any>, key) => {
        acc[key] = {
          defaultValue: staticData[key],
          isHidden: isHidden.includes(key),
        };
        return acc;
      }, {} as Record<string, any>),
  };

  /**
   * Event handler for widget open
   */
  const handleAppOpen = () => {
    console.log("Zoho Desk widget opened");
  };

  /**
   * Event handler for widget close
   */
  const handleAppClose = () => {
    console.log("Zoho Desk widget closed");
  };

  /**
   * Custom button styles for the widget
   */
  const customButtonStyles = {
    backgroundColor: "#28a745",
    borderRadius: "25px",
    fontSize: "16px",
    padding: "12px 20px",
  };

  /**
   * Utility function handlers for widget control
   */
  const widgetControls = {
    openWidget: () => ZohoDeskUtils.openWidget(),
    closeWidget: () => ZohoDeskUtils.closeWidget(),
    openSubmitTicketForm: () => ZohoDeskUtils.openSubmitTicketForm(),
    openSubmitTicketFormWithCustomIds: () =>
      ZohoDeskUtils.openSubmitTicketForm(
        NEXT_PUBLIC_ZOHO_DEPT_ID,
        NEXT_PUBLIC_ZOHO_LAYOUT_ID
      ),
    routeToTicketForm: () =>
      ZohoDeskUtils.routeToTicketForm(
        NEXT_PUBLIC_ZOHO_DEPT_ID,
        NEXT_PUBLIC_ZOHO_LAYOUT_ID
      ),
    hideLauncher: () => ZohoDeskUtils.hideLauncher(),
    showLauncher: () => ZohoDeskUtils.showLauncher(),
    checkStatus: () => {
      const isAvailable = ZohoDeskUtils.isAvailable();
      const hasZohoDeskAsap = !!(window as any).ZohoDeskAsap;
      const hasInvokeMethod =
        hasZohoDeskAsap &&
        typeof (window as any).ZohoDeskAsap.invoke === "function";

      console.log("Zoho Desk Widget Status:");
      console.log("- Widget Available:", isAvailable);
      console.log("- ZohoDeskAsap Object:", hasZohoDeskAsap);
      console.log("- Invoke Method:", hasInvokeMethod);
      console.log("- Full ZohoDeskAsap:", (window as any).ZohoDeskAsap);

      alert(
        `Widget Status: ${
          isAvailable ? "Available" : "Not Available"
        }\nCheck console for details`
      );
    },
  };

  return (
    <>
      {/* Zoho Desk Widget Component */}
      <ZohoDeskTicketing
        autoPopulateFields={exampleAutoPopulateFields}
        showOpenButton={true}
        showSubmitTicketButton={buttonType === "submit-ticket"}
        onAppOpen={handleAppOpen}
        onAppClose={handleAppClose}
        customButtonStyles={customButtonStyles}
        buttonPosition="bottom-right"
      />
      {/* Control Panel - Only show for 'all' button type */}
      {buttonType === "all" && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "20px",
            background: "white",
            padding: "15px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            zIndex: 1000,
          }}
        >
          <h3>Control Panel</h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <button onClick={widgetControls.openWidget}>
              Open Widget (Utility)
            </button>
            <button onClick={widgetControls.closeWidget}>
              Close Widget (Utility)
            </button>
            <button onClick={widgetControls.openSubmitTicketForm}>
              Open Submit Ticket Form (Env Vars)
            </button>
            <button onClick={widgetControls.openSubmitTicketFormWithCustomIds}>
              Open Submit Ticket Form (Custom IDs)
            </button>
            <button onClick={widgetControls.routeToTicketForm}>
              Go to Ticket Form
            </button>
            <button onClick={widgetControls.hideLauncher}>Hide Launcher</button>
            <button onClick={widgetControls.showLauncher}>Show Launcher</button>
            <button
              onClick={widgetControls.checkStatus}
              style={{ backgroundColor: "#17a2b8", color: "white" }}
            >
              Check Widget Status
            </button>
          </div>
        </div>
      )}
      {isShowDoc && (
        <div style={{ padding: "20px" }}>
          <h1>Zoho Desk Ticketing Integration Example</h1>

          <div style={{ marginBottom: "20px" }}>
            <h2>Component with Auto-Populate Fields</h2>
            <p>
              This example shows the ZohoDeskTicketing component with custom
              buttons and auto-populate fields configured. The submit ticket
              button uses environment variables for department and layout IDs.
            </p>
          </div>

          {/* Documentation Section */}
          <div style={{ marginTop: "50px", maxWidth: "800px" }}>
            <h2>Configuration Examples</h2>

            <h3>1. Environment Variables Required</h3>
            <pre
              style={{
                background: "#f5f5f5",
                padding: "10px",
                overflow: "auto",
              }}
            >
              {`# Add to your .env file:
                NEXT_PUBLIC_ZOHO_WIDGET_ID=your_widget_id
                NEXT_PUBLIC_ZOHO_ORG_ID=your_org_id
                NEXT_PUBLIC_ZOHO_DEPT_ID=your_department_id`}
            </pre>

            <h3>2. Auto-Populate Fields Format</h3>
            <pre
              style={{
                background: "#f5f5f5",
                padding: "10px",
                overflow: "auto",
              }}
            >
              {`const autoPopulateFields = {
                "departmentId&&&layoutId": {
                  "field_name": {
                    defaultValue: "field_value",
                    isHidden: false // optional, defaults to false
                  },
                  "cf_custom_field": {
                    defaultValue: "Custom Value",
                    isHidden: true // hidden from user but pre-filled
                  },
                  "subject": {
                    defaultValue: "Pre-filled Subject"
                  }
                }
              };`}
            </pre>

            <h3>3. Submit Ticket Button Usage</h3>
            <pre
              style={{
                background: "#f5f5f5",
                padding: "10px",
                overflow: "auto",
              }}
            >
              {`// Uses environment variables automatically
                <ZohoDeskTicketing showSubmitTicketButton={true} />

                // Or use utility function with custom IDs
                ZohoDeskUtils.openSubmitTicketForm("departmentId", "layoutId");

                // Or use utility function with environment variables
                ZohoDeskUtils.openSubmitTicketForm();`}
            </pre>

            <h3>4. Common Field Names</h3>
            <ul>
              <li>
                <code>subject</code> - Ticket subject
              </li>
              <li>
                <code>description</code> - Ticket description
              </li>
              <li>
                <code>cf_*</code> - Custom fields (replace * with actual field
                name)
              </li>
              <li>
                <code>priority</code> - Ticket priority
              </li>
              <li>
                <code>category</code> - Ticket category
              </li>
            </ul>

            <h3>5. Button Position Options</h3>
            <ul>
              <li>
                <code>top-right</code>
              </li>
              <li>
                <code>bottom-right</code> (default)
              </li>
              <li>
                <code>bottom-left</code>
              </li>
              <li>
                <code>top-left</code>
              </li>
            </ul>

            <h3>6. Getting Department and Layout IDs</h3>
            <p>To get your department and layout IDs:</p>
            <ol>
              <li>Go to Zoho Desk Admin Panel</li>
              <li>Navigate to Setup → General → Departments</li>
              <li>Click on a department to see its ID in the URL</li>
              <li>Go to Setup → Customization → Layouts</li>
              <li>Click on a layout to see its ID in the URL</li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
};

export default ZohoDeskTicketingExample;
