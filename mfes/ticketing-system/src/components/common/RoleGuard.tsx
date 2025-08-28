import React, { ReactNode } from "react";
import { useTicketing } from "@/hooks/useTicketing";
import { checkPermission } from "@/utils/roleUtils";
import { RoleConfig } from "@/types/config.types";

interface RoleGuardProps {
  children: ReactNode;
  roles?: string[];
  permissions?: (keyof RoleConfig["permissions"])[];
  requireAll?: boolean;
  fallback?: ReactNode;
  inverse?: boolean;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  roles = [],
  permissions = [],
  requireAll = false,
  fallback = null,
  inverse = false,
}) => {
  const { currentUser, appConfig } = useTicketing();

  // If no user or config, don't render
  if (!currentUser || !appConfig) {
    return <>{fallback}</>;
  }

  let hasAccess = true;

  // Check role-based access
  if (roles.length > 0) {
    const roleMatch = roles.includes(currentUser.role);
    if (requireAll) {
      hasAccess = hasAccess && roleMatch;
    } else {
      hasAccess = roleMatch;
    }
  }

  // Check permission-based access
  if (permissions.length > 0) {
    const permissionChecks = permissions.map((permission) =>
      checkPermission(permission, appConfig, currentUser)
    );

    const permissionMatch = requireAll
      ? permissionChecks.every(Boolean)
      : permissionChecks.some(Boolean);

    if (requireAll) {
      hasAccess = hasAccess && permissionMatch;
    } else {
      hasAccess = hasAccess || permissionMatch;
    }
  }

  // Apply inverse logic if specified
  const shouldRender = inverse ? !hasAccess : hasAccess;

  return shouldRender ? <>{children}</> : <>{fallback}</>;
};
