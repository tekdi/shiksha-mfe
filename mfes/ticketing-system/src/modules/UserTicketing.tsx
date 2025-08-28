import React from "react";
import { TicketingProvider } from "@/components/common/TicketingProvider";
import { TicketRaiseButton } from "@/components/user/TicketRaiseButton";
import { AppConfig } from "@/types/config.types";

interface UserTicketingProps {
  config?: Partial<AppConfig>;
  appName?: string;
  userRole?: string;
  placement?: "header" | "sidebar" | "floating" | "footer" | "dashboard";
  variant?: "primary" | "secondary" | "fab" | "icon";
  label?: string;
  className?: string;
}

export const UserTicketing: React.FC<UserTicketingProps> = ({
  config,
  appName,
  userRole,
  placement = "header",
  variant = "primary",
  label,
  className,
}) => {
  return (
    <TicketingProvider config={config} appName={appName} userRole={userRole}>
      <TicketRaiseButton
        placement={placement}
        variant={variant}
        label={label}
        className={className}
      />
    </TicketingProvider>
  );
};
