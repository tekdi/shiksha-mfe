import axios from "axios";
import { AppConfig } from "@/types/config.types";
import {
  ExportFilters,
  ExportResponse,
  ExportProgress,
} from "@/types/export.types";
import { API_ENDPOINTS } from "@/utils/constants";
import { ConfigService } from "./configService";
import toast from "react-hot-toast";

export class ExportService {
  /**
   * Export tickets to CSV
   */
  static async exportTickets(
    filters: ExportFilters,
    appConfig: AppConfig,
    onProgress?: (progress: number) => void
  ): Promise<ExportResponse> {
    try {
      const envConfig = ConfigService.getEnvironmentConfig();

      const response = await axios.post(
        `${envConfig.apiBaseUrl}${API_ENDPOINTS.TICKETS.EXPORT}`,
        {
          filters,
          appName: appConfig.appName,
          format: "csv",
          requestedAt: new Date().toISOString(),
        }
      );

      const { exportId } = response.data;

      // Poll for progress if callback provided
      if (onProgress && exportId) {
        await this.pollExportProgress(exportId, onProgress);
      }

      // Show success message
      toast.success("Export completed successfully!");

      return response.data;
    } catch (error) {
      console.error("Error exporting tickets:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to export tickets";
      toast.error(errorMessage);

      throw new Error(errorMessage);
    }
  }

  /**
   * Poll export progress
   */
  static async pollExportProgress(
    exportId: string,
    onProgress: (progress: number) => void
  ): Promise<void> {
    const envConfig = ConfigService.getEnvironmentConfig();
    const maxAttempts = 30; // 30 attempts with 2 second intervals = 1 minute max
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        const response = await axios.get(
          `${envConfig.apiBaseUrl}${API_ENDPOINTS.EXPORT.PROGRESS}/${exportId}`
        );

        const progress: ExportProgress = response.data;
        onProgress(progress.progress);

        if (progress.status === "completed") {
          onProgress(100);
          if (progress.downloadUrl) {
            // Automatically download the file
            this.downloadFile(
              progress.downloadUrl,
              `tickets-export-${exportId}.csv`
            );
          }
          return;
        }

        if (progress.status === "failed") {
          throw new Error(progress.error || "Export failed");
        }

        // Continue polling if still processing
        if (progress.status === "processing" && attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 2000); // Poll every 2 seconds
        } else if (attempts >= maxAttempts) {
          throw new Error("Export timeout - please try again");
        }
      } catch (error) {
        console.error("Error polling export progress:", error);
        throw error;
      }
    };

    await poll();
  }

  /**
   * Download file from URL
   */
  static downloadFile(url: string, filename: string): void {
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.target = "_blank";

      // Append to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download export file");
    }
  }

  /**
   * Get export history
   */
  static async getExportHistory(appConfig: AppConfig): Promise<any[]> {
    try {
      const envConfig = ConfigService.getEnvironmentConfig();

      const response = await axios.get(
        `${envConfig.apiBaseUrl}${API_ENDPOINTS.EXPORT.HISTORY}`,
        {
          params: {
            appName: appConfig.appName,
          },
        }
      );

      return response.data.exports || [];
    } catch (error) {
      console.error("Error fetching export history:", error);
      throw new Error("Failed to fetch export history");
    }
  }

  /**
   * Generate CSV data on client side (fallback)
   */
  static generateCSV(tickets: any[]): string {
    if (!tickets.length) {
      return "No data to export";
    }

    // CSV headers
    const headers = [
      "User ID",
      "Username",
      "Email",
      "Phone",
      "Issue Description",
      "Date Reported",
      "Time Reported",
      "Category",
      "Priority",
      "Status",
      "Replies",
    ];

    // Convert tickets to CSV rows
    const rows = tickets.map((ticket) => {
      const date = new Date(ticket.createdAt);
      const replies = ticket.replies
        ? ticket.replies
            .map((r: any) => `${r.agentName}: ${r.replyText}`)
            .join(" | ")
        : "";

      return [
        ticket.userId,
        ticket.username,
        ticket.email,
        ticket.phone || "",
        ticket.description,
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        ticket.category,
        ticket.priority,
        ticket.status,
        replies,
      ];
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    return csvContent;
  }

  /**
   * Download CSV file directly
   */
  static downloadCSV(csvContent: string, filename: string): void {
    try {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      this.downloadFile(url, filename);

      // Clean up the URL object
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Error downloading CSV:", error);
      toast.error("Failed to download CSV file");
    }
  }

  /**
   * Validate export filters
   */
  static validateExportFilters(filters: ExportFilters): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Date range validation
    if (filters.dateRange) {
      const { from, to } = filters.dateRange;
      if (from && to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);

        if (fromDate > toDate) {
          errors.push("Start date cannot be after end date");
        }

        const daysDiff =
          (toDate.getTime() - fromDate.getTime()) / (1000 * 3600 * 24);
        if (daysDiff > 365) {
          errors.push("Date range cannot exceed 365 days");
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get export statistics
   */
  static async getExportStats(appConfig: AppConfig): Promise<any> {
    try {
      const envConfig = ConfigService.getEnvironmentConfig();

      const response = await axios.get(
        `${envConfig.apiBaseUrl}${API_ENDPOINTS.EXPORT.HISTORY}/stats`,
        {
          params: {
            appName: appConfig.appName,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching export stats:", error);
      return {
        totalExports: 0,
        totalRecords: 0,
        lastExportDate: null,
      };
    }
  }
}
