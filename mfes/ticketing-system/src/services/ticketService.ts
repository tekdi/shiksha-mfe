import axios from "axios";
import { AppConfig } from "@/types/config.types";
import {
  TicketSubmission,
  TicketResponse,
  UserData,
  ValidationResult,
  Ticket,
} from "@/types/ticket.types";
import {
  buildZohoUrl,
  generateTicketId,
  validateZohoConfig,
} from "@/utils/zohoUrlBuilder";
import { API_ENDPOINTS } from "@/utils/constants";
import { ConfigService } from "./configService";
import toast from "react-hot-toast";

export class TicketService {
  /**
   * Create a new ticket
   */
  static async createTicket(
    ticketData: TicketSubmission,
    appConfig: AppConfig
  ): Promise<TicketResponse> {
    try {
      // Validate configuration
      if (!validateZohoConfig(appConfig)) {
        throw new Error("Invalid Zoho configuration");
      }

      // Validate ticket data
      const validation = this.validateTicketData(ticketData);
      if (!validation.isValid) {
        throw new Error(
          `Validation failed: ${Object.values(validation.errors).join(", ")}`
        );
      }

      // Log ticket submission to backend
      await this.logTicketSubmission(ticketData, appConfig);

      // Build Zoho URL with app-specific configuration
      const zohoUrl = buildZohoUrl(ticketData, appConfig);

      // Generate temporary ticket ID
      const ticketId = generateTicketId();

      // Show success message
      toast.success(
        "Redirecting to Zoho Desk to complete your ticket submission..."
      );

      // Redirect to Zoho Desk
      window.open(zohoUrl, "_blank");

      return {
        success: true,
        ticketId,
        message: "Ticket created successfully",
      };
    } catch (error) {
      console.error("Error creating ticket:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create ticket";
      toast.error(errorMessage);

      return {
        success: false,
        ticketId: "",
        error: errorMessage,
      };
    }
  }

  /**
   * Log ticket submission to backend
   */
  static async logTicketSubmission(
    ticketData: TicketSubmission,
    appConfig: AppConfig
  ): Promise<void> {
    try {
      const envConfig = ConfigService.getEnvironmentConfig();

      await axios.post(`${envConfig.apiBaseUrl}${API_ENDPOINTS.TICKETS.LOG}`, {
        ...ticketData,
        appName: appConfig.appName,
        timestamp: new Date().toISOString(),
        source: "ticketing-mfe",
      });
    } catch (error) {
      console.error("Error logging ticket submission:", error);
      // Don't throw error for logging failure - ticket creation should continue
    }
  }

  /**
   * Validate ticket data
   */
  static validateTicketData(ticketData: TicketSubmission): ValidationResult {
    const errors: Record<string, string> = {};

    // Required fields validation
    if (!ticketData.subject || ticketData.subject.trim().length === 0) {
      errors.subject = "Subject is required";
    }

    if (!ticketData.description || ticketData.description.trim().length === 0) {
      errors.description = "Description is required";
    }

    if (!ticketData.email || !this.isValidEmail(ticketData.email)) {
      errors.email = "Valid email is required";
    }

    if (!ticketData.userId || ticketData.userId.trim().length === 0) {
      errors.userId = "User ID is required";
    }

    // Length validation
    if (ticketData.subject && ticketData.subject.length > 200) {
      errors.subject = "Subject must be less than 200 characters";
    }

    if (ticketData.description && ticketData.description.length > 2000) {
      errors.description = "Description must be less than 2000 characters";
    }

    // Phone validation (if provided)
    if (ticketData.phone && !this.isValidPhone(ticketData.phone)) {
      errors.phone = "Valid phone number is required";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Get user tickets
   */
  static async getUserTickets(
    userId: string,
    appConfig: AppConfig
  ): Promise<Ticket[]> {
    try {
      const envConfig = ConfigService.getEnvironmentConfig();

      const response = await axios.get(
        `${envConfig.apiBaseUrl}${API_ENDPOINTS.TICKETS.LIST}`,
        {
          params: {
            userId,
            appName: appConfig.appName,
          },
        }
      );

      return response.data.tickets || [];
    } catch (error) {
      console.error("Error fetching user tickets:", error);
      throw new Error("Failed to fetch tickets");
    }
  }

  /**
   * Get user data from localStorage or API
   */
  static getUserData(): UserData | null {
    try {
      if (typeof window === "undefined") {
        return null;
      }

      // Try to get from localStorage first
      const adminInfo = localStorage.getItem("adminInfo");
      const userInfo = localStorage.getItem("userInfo");

      if (adminInfo && adminInfo !== "undefined") {
        const admin = JSON.parse(adminInfo);
        return {
          userId: admin.userId || admin.id,
          username: admin.username || admin.name,
          email: admin.email,
          phone: admin.phone || "",
          role: admin.role,
          tenantData: admin.tenantData,
        };
      }

      if (userInfo && userInfo !== "undefined") {
        const user = JSON.parse(userInfo);
        return {
          userId: user.userId || user.id,
          username: user.username || user.name,
          email: user.email,
          phone: user.phone || "",
          role: user.role || "user",
          tenantData: user.tenantData,
        };
      }

      return null;
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  }

  /**
   * Pre-fill ticket data with user information
   */
  static prefillTicketData(
    userData: UserData,
    category?: string
  ): Partial<TicketSubmission> {
    return {
      userId: userData.userId,
      username: userData.username,
      email: userData.email,
      phone: userData.phone,
      category: category || "",
      priority: "medium",
    };
  }

  /**
   * Email validation
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Phone validation
   */
  private static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[+]?[\d\s\-()]{7,15}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Handle Zoho webhook response
   */
  static async handleZohoWebhook(webhookData: any): Promise<void> {
    try {
      const envConfig = ConfigService.getEnvironmentConfig();

      await axios.post(
        `${envConfig.apiBaseUrl}${API_ENDPOINTS.TICKETS.WEBHOOK}`,
        webhookData
      );
    } catch (error) {
      console.error("Error handling Zoho webhook:", error);
    }
  }

  /**
   * Update ticket status
   */
  static async updateTicketStatus(
    ticketId: string,
    status: string,
    appConfig: AppConfig
  ): Promise<void> {
    try {
      const envConfig = ConfigService.getEnvironmentConfig();

      await axios.patch(
        `${envConfig.apiBaseUrl}${API_ENDPOINTS.TICKETS.LIST}/${ticketId}`,
        {
          status,
          appName: appConfig.appName,
          updatedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error("Error updating ticket status:", error);
      throw new Error("Failed to update ticket status");
    }
  }

  /**
   * Search tickets
   */
  static async searchTickets(
    query: string,
    appConfig: AppConfig,
    filters?: {
      status?: string[];
      category?: string[];
      priority?: string[];
      dateRange?: { from: string; to: string };
    }
  ): Promise<Ticket[]> {
    try {
      const envConfig = ConfigService.getEnvironmentConfig();

      const response = await axios.get(
        `${envConfig.apiBaseUrl}${API_ENDPOINTS.TICKETS.LIST}/search`,
        {
          params: {
            query,
            appName: appConfig.appName,
            ...filters,
          },
        }
      );

      return response.data.tickets || [];
    } catch (error) {
      console.error("Error searching tickets:", error);
      throw new Error("Failed to search tickets");
    }
  }
}
