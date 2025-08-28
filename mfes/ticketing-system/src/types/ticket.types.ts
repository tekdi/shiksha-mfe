export interface UserData {
  userId: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  tenantData?: {
    tenantName: string;
    tenantId: string;
  }[];
}

export interface TicketSubmission {
  userId: string;
  username: string;
  email: string;
  phone: string;
  subject: string;
  description: string;
  category?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  attachments?: File[];
  customFields?: Record<string, any>;
}

export interface TicketResponse {
  success: boolean;
  ticketId: string;
  message?: string;
  error?: string;
}

export interface Ticket {
  id: string;
  ticketId: string;
  userId: string;
  username: string;
  email: string;
  phone: string;
  subject: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in-progress" | "resolved" | "closed";
  createdAt: string;
  updatedAt: string;
  replies?: TicketReply[];
}

export interface TicketReply {
  id: string;
  ticketId: string;
  agentName: string;
  agentEmail: string;
  replyText: string;
  repliedAt: string;
  isInternal: boolean;
}

export interface TicketCategory {
  id: string;
  label: string;
  description?: string;
  departmentId?: string;
  appName?: string;
}

export interface TicketFormData {
  category: string;
  subject: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  attachments?: FileList;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}
