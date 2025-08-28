import { AppConfig, RoleConfig } from "@/types/config.types";
import { UserData } from "@/types/ticket.types";
import { ROLE_CONFIGS, DEFAULT_ROLE_CONFIG } from "./constants";

export const checkPermission = (
  permission: keyof RoleConfig["permissions"],
  appConfig: AppConfig | null,
  currentUser: UserData | null
): boolean => {
  if (!appConfig || !currentUser) {
    return false;
  }

  const roleConfig = getRoleConfig(currentUser.role, appConfig.appName);
  return roleConfig.permissions[permission];
};

export const getRoleConfig = (role: string, appName: string): RoleConfig => {
  const appRoleConfigs = ROLE_CONFIGS[appName];
  if (appRoleConfigs && appRoleConfigs[role]) {
    return appRoleConfigs[role];
  }
  return DEFAULT_ROLE_CONFIG;
};

export const canUserCreateTickets = (
  userRole: string,
  appConfig: AppConfig
): boolean => {
  return appConfig.roles.canCreateTicket.includes(userRole);
};

export const canUserExportData = (
  userRole: string,
  appConfig: AppConfig
): boolean => {
  return appConfig.roles.canExportData.includes(userRole);
};

export const canUserManageTickets = (
  userRole: string,
  appConfig: AppConfig
): boolean => {
  return appConfig.roles.canManageTickets.includes(userRole);
};

export const hasFeatureAccess = (
  feature: keyof AppConfig["features"],
  appConfig: AppConfig
): boolean => {
  return appConfig.features[feature];
};

export const getDataAccessLevel = (
  userRole: string,
  appConfig: AppConfig
): RoleConfig["dataAccess"] => {
  const roleConfig = getRoleConfig(userRole, appConfig.appName);
  return roleConfig.dataAccess;
};

export const filterTicketsByAccess = (
  tickets: any[],
  currentUser: UserData,
  appConfig: AppConfig
): any[] => {
  const dataAccess = getDataAccessLevel(currentUser.role, appConfig);

  if (dataAccess.allTickets) {
    return tickets;
  }

  if (dataAccess.ownTicketsOnly) {
    return tickets.filter((ticket) => ticket.userId === currentUser.userId);
  }

  if (dataAccess.departmentTickets) {
    // Filter by department - would need department info in tickets
    return tickets.filter(
      (ticket) =>
        ticket.userId === currentUser.userId ||
        ticket.department === currentUser.tenantData?.[0]?.tenantId
    );
  }

  return [];
};

export const getUserRoleFromToken = (token: string): string => {
  try {
    // Decode JWT token to get user role
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || "user";
  } catch (error) {
    console.error("Error decoding token:", error);
    return "user";
  }
};

export const getUserRoleFromLocalStorage = (): string => {
  if (typeof window !== "undefined") {
    const adminInfo = localStorage.getItem("adminInfo");
    const userInfo = localStorage.getItem("userInfo");

    if (adminInfo && adminInfo !== "undefined") {
      const admin = JSON.parse(adminInfo);
      return admin.role || "admin";
    }

    if (userInfo && userInfo !== "undefined") {
      const user = JSON.parse(userInfo);
      return user.role || "user";
    }
  }

  return "user";
};
