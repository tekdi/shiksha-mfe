import { AppConfig, RoleConfig, ZohoConfig } from "@/types/config.types";
import {
  APP_CONFIGS,
  DEFAULT_CONFIG,
  ROLE_CONFIGS,
  DEFAULT_ROLE_CONFIG,
} from "@/utils/constants";

export class ConfigService {
  /**
   * Get app-specific configuration
   */
  static getAppConfig(appName: string): AppConfig {
    return APP_CONFIGS[appName] || DEFAULT_CONFIG;
  }

  /**
   * Get Zoho Desk configuration for the app
   */
  static getZohoConfig(appName: string): ZohoConfig {
    const appConfig = this.getAppConfig(appName);
    return {
      baseUrl: `${appConfig.zoho.portalUrl}/portal/newticket`,
      fields: {
        email: "zd_email",
        phone: "zd_phone",
        subject: "zd_subject",
        description: "zd_description",
        department: appConfig.zoho.departmentId,
        category: "zd_category",
        priority: "zd_priority",
        ...appConfig.zoho.customFields,
      },
    };
  }

  /**
   * Get role-specific permissions for the app
   */
  static getRolePermissions(role: string, appName: string): RoleConfig {
    const appRoleConfigs = ROLE_CONFIGS[appName];
    if (appRoleConfigs && appRoleConfigs[role]) {
      return appRoleConfigs[role];
    }
    return DEFAULT_ROLE_CONFIG;
  }

  /**
   * Validate app configuration
   */
  static validateAppConfig(config: AppConfig): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate app name
    if (!config.appName) {
      errors.push("App name is required");
    }

    // Validate Zoho configuration
    if (!config.zoho.portalUrl) {
      errors.push("Zoho portal URL is required");
    }

    if (!config.zoho.departmentId) {
      errors.push("Zoho department ID is required");
    }

    // Validate features
    if (typeof config.features !== "object") {
      errors.push("Features configuration is required");
    }

    // Validate roles
    if (!Array.isArray(config.roles.canCreateTicket)) {
      errors.push("canCreateTicket roles must be an array");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Merge custom configuration with default
   */
  static mergeConfig(
    customConfig: Partial<AppConfig>,
    appName: string
  ): AppConfig {
    const defaultConfig = this.getAppConfig(appName);

    return {
      ...defaultConfig,
      ...customConfig,
      features: {
        ...defaultConfig.features,
        ...customConfig.features,
      },
      roles: {
        ...defaultConfig.roles,
        ...customConfig.roles,
      },
      ui: {
        ...defaultConfig.ui,
        ...customConfig.ui,
      },
      zoho: {
        ...defaultConfig.zoho,
        ...customConfig.zoho,
        customFields: {
          ...defaultConfig.zoho.customFields,
          ...customConfig.zoho?.customFields,
        },
      },
      categories: customConfig.categories || defaultConfig.categories,
    };
  }

  /**
   * Get environment-specific configuration
   */
  static getEnvironmentConfig(): {
    apiBaseUrl: string;
    zohoBaseUrl: string;
    environment: "development" | "staging" | "production";
  } {
    return {
      apiBaseUrl:
        process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.yourapp.com",
      zohoBaseUrl:
        process.env.NEXT_PUBLIC_ZOHO_BASE_URL || "https://desk.zoho.com",
      environment: (process.env.NODE_ENV as any) || "development",
    };
  }

  /**
   * Check if feature is enabled for the app
   */
  static isFeatureEnabled(
    feature: keyof AppConfig["features"],
    appConfig: AppConfig
  ): boolean {
    return appConfig.features[feature] === true;
  }

  /**
   * Check if user role has permission
   */
  static hasPermission(
    userRole: string,
    permission: keyof RoleConfig["permissions"],
    appName: string
  ): boolean {
    const roleConfig = this.getRolePermissions(userRole, appName);
    return roleConfig.permissions[permission];
  }

  /**
   * Get user data access level
   */
  static getDataAccessLevel(
    userRole: string,
    appName: string
  ): RoleConfig["dataAccess"] {
    const roleConfig = this.getRolePermissions(userRole, appName);
    return roleConfig.dataAccess;
  }

  /**
   * Get app-specific categories
   */
  static getCategories(appName: string): AppConfig["categories"] {
    const config = this.getAppConfig(appName);
    return config.categories;
  }

  /**
   * Initialize app configuration from environment
   */
  static initializeConfig(appName: string): AppConfig {
    const envConfig = this.getEnvironmentConfig();
    const baseConfig = this.getAppConfig(appName);

    // Override with environment-specific values
    const environmentOverrides: Partial<AppConfig> = {
      zoho: {
        ...baseConfig.zoho,
        orgId: this.getEnvZohoOrgId(appName),
        departmentId: this.getEnvZohoDepartmentId(appName),
        portalUrl:
          process.env.NEXT_PUBLIC_ZOHO_PORTAL_URL || baseConfig.zoho.portalUrl,
      },
    };

    return this.mergeConfig(environmentOverrides, appName);
  }

  /**
   * Get app-specific Zoho org ID from environment
   */
  private static getEnvZohoOrgId(appName: string): string {
    switch (appName) {
      case "learner-web-app":
        return process.env.NEXT_PUBLIC_LEARNER_ZOHO_ORG_ID || "";
      case "teachers":
        return process.env.NEXT_PUBLIC_TEACHER_ZOHO_ORG_ID || "";
      case "admin-app-repo":
        return process.env.NEXT_PUBLIC_ADMIN_ZOHO_ORG_ID || "";
      default:
        return process.env.NEXT_PUBLIC_ZOHO_ORG_ID || "";
    }
  }

  /**
   * Get app-specific Zoho department ID from environment
   */
  private static getEnvZohoDepartmentId(appName: string): string {
    switch (appName) {
      case "learner-web-app":
        return process.env.NEXT_PUBLIC_LEARNER_DEPT_ID || "";
      case "teachers":
        return process.env.NEXT_PUBLIC_TEACHER_DEPT_ID || "";
      case "admin-app-repo":
        return process.env.NEXT_PUBLIC_ADMIN_DEPT_ID || "";
      default:
        return process.env.NEXT_PUBLIC_ZOHO_DEPT_ID || "";
    }
  }
}
