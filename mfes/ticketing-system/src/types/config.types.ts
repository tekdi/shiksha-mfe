export interface AppConfig {
  appName: "learner-web-app" | "teachers" | "admin-app-repo";
  features: {
    ticketCreation: boolean;
    csvExport: boolean;
    ticketManagement: boolean;
  };
  roles: {
    canCreateTicket: string[];
    canExportData: string[];
    canManageTickets: string[];
  };
  ui: {
    theme: "light" | "dark" | "auto";
    placement: "header" | "sidebar" | "floating" | "footer" | "dashboard";
    buttonStyle: "primary" | "secondary" | "fab";
  };
  zoho: {
    orgId: string;
    departmentId: string;
    portalUrl: string;
    customFields: Record<string, string>;
  };
  categories: {
    id: string;
    label: string;
    departmentId?: string;
  }[];
}

export interface RoleConfig {
  role: string;
  permissions: {
    createTicket: boolean;
    viewTickets: boolean;
    exportTickets: boolean;
    manageTickets: boolean;
  };
  dataAccess: {
    ownTicketsOnly: boolean;
    departmentTickets: boolean;
    allTickets: boolean;
  };
}

export interface ZohoConfig {
  baseUrl: string;
  fields: {
    email: string;
    phone: string;
    subject: string;
    description: string;
    department: string;
    [key: string]: string;
  };
}

export interface ThemeConfig {
  components: {
    TicketButton: {
      variants: {
        fab: React.ComponentProps<any>;
        header: React.ComponentProps<any>;
        sidebar: React.ComponentProps<any>;
      };
    };
    TicketForm: {
      layout: "modal" | "page" | "drawer";
      width: "sm" | "md" | "lg" | "xl";
    };
  };
}

export interface FlowConfig {
  ticketCreation: {
    steps: ("userInfo" | "category" | "description" | "attachments")[];
    validation: ValidationConfig;
    submission: "redirect" | "api" | "hybrid";
  };
  export: {
    filters: ("dateRange" | "status" | "category" | "user")[];
    formats: ("csv" | "excel" | "pdf")[];
    scheduling: boolean;
  };
}

export interface ValidationConfig {
  required: string[];
  minLength: Record<string, number>;
  maxLength: Record<string, number>;
  patterns: Record<string, RegExp>;
}
