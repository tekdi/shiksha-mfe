import axios from "axios";
import { UserData } from "@/types/ticket.types";
import { API_ENDPOINTS } from "@/utils/constants";
import { ConfigService } from "./configService";

export class UserService {
  /**
   * Get current user data from localStorage
   */
  static getCurrentUser(): UserData | null {
    try {
      if (typeof window === "undefined") {
        return null;
      }

      // Try to get admin info first
      const adminInfo = localStorage.getItem("adminInfo");
      if (adminInfo && adminInfo !== "undefined") {
        const admin = JSON.parse(adminInfo);
        return this.normalizeUserData(admin, "admin");
      }

      // Then try to get user info
      const userInfo = localStorage.getItem("userInfo");
      if (userInfo && userInfo !== "undefined") {
        const user = JSON.parse(userInfo);
        return this.normalizeUserData(user, "user");
      }

      return null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  /**
   * Normalize user data to consistent format
   */
  private static normalizeUserData(
    userData: any,
    defaultRole?: string
  ): UserData {
    return {
      userId: userData.userId || userData.id || "",
      username: userData.username || userData.name || "",
      email: userData.email || "",
      phone: userData.phone || userData.mobile || "",
      role: userData.role || defaultRole || "user",
      tenantData: userData.tenantData || [],
    };
  }

  /**
   * Fetch user profile from API
   */
  static async fetchUserProfile(userId: string): Promise<UserData | null> {
    try {
      const envConfig = ConfigService.getEnvironmentConfig();

      const response = await axios.get(
        `${envConfig.apiBaseUrl}${API_ENDPOINTS.USER.PROFILE}/${userId}`
      );

      if (response.data && response.data.user) {
        return this.normalizeUserData(response.data.user);
      }

      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw new Error("Failed to fetch user profile");
    }
  }

  /**
   * Update user data in localStorage
   */
  static updateUserData(userData: UserData): void {
    try {
      if (typeof window === "undefined") {
        return;
      }

      const userDataString = JSON.stringify(userData);

      // Update based on role
      if (userData.role === "admin" || userData.role === "central_admin") {
        localStorage.setItem("adminInfo", userDataString);
      } else {
        localStorage.setItem("userInfo", userDataString);
      }
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  }

  /**
   * Clear user data from localStorage
   */
  static clearUserData(): void {
    try {
      if (typeof window === "undefined") {
        return;
      }

      localStorage.removeItem("adminInfo");
      localStorage.removeItem("userInfo");
    } catch (error) {
      console.error("Error clearing user data:", error);
    }
  }

  /**
   * Check if user has specific permission
   */
  static hasPermission(
    userData: UserData,
    permission: string,
    appName: string
  ): boolean {
    try {
      return ConfigService.hasPermission(
        userData.role,
        permission as any,
        appName
      );
    } catch (error) {
      console.error("Error checking permission:", error);
      return false;
    }
  }

  /**
   * Get user's data access level
   */
  static getDataAccessLevel(userData: UserData, appName: string): any {
    try {
      return ConfigService.getDataAccessLevel(userData.role, appName);
    } catch (error) {
      console.error("Error getting data access level:", error);
      return {
        ownTicketsOnly: true,
        departmentTickets: false,
        allTickets: false,
      };
    }
  }

  /**
   * Validate user data
   */
  static validateUserData(userData: Partial<UserData>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!userData.userId) {
      errors.push("User ID is required");
    }

    if (!userData.username) {
      errors.push("Username is required");
    }

    if (!userData.email) {
      errors.push("Email is required");
    } else if (!this.isValidEmail(userData.email)) {
      errors.push("Valid email is required");
    }

    if (!userData.role) {
      errors.push("User role is required");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Email validation helper
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
