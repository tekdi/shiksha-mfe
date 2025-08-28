import React from "react";
import { Box } from "@mui/material";
import { TicketingProvider } from "@/components/common/TicketingProvider";
import { AppConfig } from "@/types/config.types";

// Placeholder for admin components - these would be created later
const TicketExportButton = () => <div>Export Button Placeholder</div>;
const TicketManagementDashboard = () => (
  <div>Management Dashboard Placeholder</div>
);

interface AdminTicketingProps {
  config?: Partial<AppConfig>;
  appName?: string;
  userRole?: string;
  showExportButton?: boolean;
  showManagementDashboard?: boolean;
}

export const AdminTicketing: React.FC<AdminTicketingProps> = ({
  config,
  appName,
  userRole,
  showExportButton = true,
  showManagementDashboard = true,
}) => {
  return (
    <TicketingProvider config={config} appName={appName} userRole={userRole}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {showExportButton && <TicketExportButton />}
        {showManagementDashboard && <TicketManagementDashboard />}
      </Box>
    </TicketingProvider>
  );
};
