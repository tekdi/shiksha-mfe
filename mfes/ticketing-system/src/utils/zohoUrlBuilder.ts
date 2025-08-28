import { AppConfig, ZohoConfig } from "@/types/config.types";
import { TicketSubmission } from "@/types/ticket.types";
import { ZOHO_FIELD_MAPPING } from "./constants";

export const buildZohoUrl = (
  ticketData: TicketSubmission,
  appConfig: AppConfig
): string => {
  const zohoConfig = getZohoConfig(appConfig);
  const params = new URLSearchParams();

  // Add standard fields
  params.append(zohoConfig.fields.email, ticketData.email);
  params.append(zohoConfig.fields.phone, ticketData.phone);
  params.append(zohoConfig.fields.subject, ticketData.subject);
  params.append(zohoConfig.fields.description, ticketData.description);
  params.append(zohoConfig.fields.department, appConfig.zoho.departmentId);

  // Add category if provided
  if (ticketData.category) {
    params.append(
      zohoConfig.fields.category || "zd_category",
      ticketData.category
    );
  }

  // Add priority if provided
  if (ticketData.priority) {
    params.append(
      zohoConfig.fields.priority || "zd_priority",
      ticketData.priority
    );
  }

  // Add app-specific custom fields
  Object.entries(appConfig.zoho.customFields).forEach(([key, value]) => {
    params.append(key, value);
  });

  // Add additional custom fields from ticket data
  if (ticketData.customFields) {
    Object.entries(ticketData.customFields).forEach(([key, value]) => {
      params.append(key, String(value));
    });
  }

  return `${zohoConfig.baseUrl}?${params.toString()}`;
};

export const getZohoConfig = (appConfig: AppConfig): ZohoConfig => {
  return {
    baseUrl: `${appConfig.zoho.portalUrl}/portal/newticket`,
    fields: {
      email: ZOHO_FIELD_MAPPING.email,
      phone: ZOHO_FIELD_MAPPING.phone,
      subject: ZOHO_FIELD_MAPPING.subject,
      description: ZOHO_FIELD_MAPPING.description,
      department: ZOHO_FIELD_MAPPING.department,
      category: ZOHO_FIELD_MAPPING.category,
      priority: ZOHO_FIELD_MAPPING.priority,
      ...appConfig.zoho.customFields,
    },
  };
};

export const validateZohoConfig = (appConfig: AppConfig): boolean => {
  const { zoho } = appConfig;

  if (!zoho.portalUrl || !zoho.departmentId) {
    console.error("Missing required Zoho configuration:", {
      portalUrl: !!zoho.portalUrl,
      departmentId: !!zoho.departmentId,
    });
    return false;
  }

  return true;
};

export const sanitizeUrlParams = (
  params: Record<string, string>
): Record<string, string> => {
  const sanitized: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value && typeof value === "string") {
      // Remove potentially harmful characters
      const cleanValue = value
        .replace(/[<>]/g, "") // Remove HTML tags
        .replace(/javascript:/gi, "") // Remove javascript: protocol
        .replace(/data:/gi, "") // Remove data: protocol
        .trim();

      if (cleanValue.length > 0) {
        sanitized[encodeURIComponent(key)] = encodeURIComponent(cleanValue);
      }
    }
  });

  return sanitized;
};

export const generateTicketId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `TKT-${timestamp}-${random}`.toUpperCase();
};

export const isValidZohoUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname.includes("zohodesk.") || urlObj.hostname.includes("zoho.")
    );
  } catch {
    return false;
  }
};

export const parseZohoResponse = (
  responseUrl: string
): { ticketId?: string; success: boolean } => {
  try {
    const urlObj = new URL(responseUrl);
    const params = new URLSearchParams(urlObj.search);

    // Common Zoho response parameters
    const ticketId = params.get("ticketId") || params.get("id");
    const status = params.get("status");

    return {
      ticketId: ticketId || undefined,
      success: status === "success" || !!ticketId,
    };
  } catch {
    return { success: false };
  }
};
