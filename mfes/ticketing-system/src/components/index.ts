// Common Components
export { TicketingProvider } from "./common/TicketingProvider";
export { RoleGuard } from "./common/RoleGuard";
export { ConfigProvider, useConfig } from "./common/ConfigProvider";

// User Components
export {
  TicketRaiseButton,
  HeaderTicketButton,
  SidebarTicketButton,
  FloatingTicketButton,
  DashboardTicketButton,
} from "./user/TicketRaiseButton";

export { TicketForm } from "./user/TicketForm";

// Zoho Components
export { ZohoOAuthButton } from "./zoho/CreateToken";
export { TokenGenerator } from "./zoho/TokenGenerator";
export { TokenGeneratorDemo } from "./zoho/TokenGeneratorDemo";

// Module Components
export { UserTicketing } from "../modules/UserTicketing";
export { AdminTicketing } from "../modules/AdminTicketing";

// Hooks
export { useTicketing } from "../hooks/useTicketing";
export { useUserRole } from "../hooks/useUserRole";
export { useAppConfig } from "../hooks/useAppConfig";

// Services
export { ConfigService } from "../services/configService";
export { TicketService } from "../services/ticketService";
export { ExportService } from "../services/exportService";
export { UserService } from "../services/userService";

// Types
export type {
  AppConfig,
  RoleConfig,
  ZohoConfig,
  ThemeConfig,
  FlowConfig,
  ValidationConfig,
} from "../types/config.types";
export type {
  UserData,
  TicketSubmission,
  TicketResponse,
  Ticket,
  TicketReply,
  TicketCategory,
  TicketFormData,
  ValidationResult,
} from "../types/ticket.types";
export type {
  ExportFilters,
  ExportOptions,
  ExportRequest,
  ExportResponse,
  ExportProgress,
  ExportHistory,
  CSVRow,
} from "../types/export.types";

// Utils
export {
  checkPermission,
  getRoleConfig,
  canUserCreateTickets,
  canUserExportData,
} from "../utils/roleUtils";
export {
  buildZohoUrl,
  generateTicketId,
  validateZohoConfig,
} from "../utils/zohoUrlBuilder";
export {
  DEFAULT_CONFIG,
  APP_CONFIGS,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
} from "../utils/constants";
