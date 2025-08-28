export interface ExportFilters {
  dateRange?: {
    from: string;
    to: string;
  };
  status?: string[];
  category?: string[];
  userId?: string[];
  priority?: string[];
  department?: string;
}

export interface ExportOptions {
  format: "csv" | "excel" | "pdf";
  includeReplies: boolean;
  includeAttachments: boolean;
  columns: string[];
}

export interface ExportRequest {
  filters: ExportFilters;
  options: ExportOptions;
  requestedBy: string;
  appName: string;
}

export interface ExportResponse {
  success: boolean;
  exportId: string;
  downloadUrl?: string;
  message?: string;
  error?: string;
}

export interface ExportProgress {
  exportId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  totalRecords: number;
  processedRecords: number;
  message?: string;
  error?: string;
  downloadUrl?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ExportHistory {
  id: string;
  exportId: string;
  requestedBy: string;
  appName: string;
  filters: ExportFilters;
  options: ExportOptions;
  status: "completed" | "failed" | "expired";
  recordCount: number;
  fileSize: string;
  downloadUrl?: string;
  createdAt: string;
  expiresAt: string;
}

export interface CSVRow {
  "User ID": string;
  Username: string;
  Email: string;
  Phone: string;
  "Issue Description": string;
  "Date Reported": string;
  "Time Reported": string;
  Category: string;
  Priority: string;
  Status: string;
  Replies: string;
  [key: string]: string;
}
