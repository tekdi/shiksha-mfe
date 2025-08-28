import { AppConfig, RoleConfig } from "@/types/config.types";

export const DEFAULT_CONFIG: AppConfig = {
  appName: "learner-web-app",
  features: {
    ticketCreation: true,
    csvExport: false,
    ticketManagement: false,
  },
  roles: {
    canCreateTicket: ["user", "learner", "teacher", "admin"],
    canExportData: ["admin", "central_admin"],
    canManageTickets: ["admin", "central_admin"],
  },
  ui: {
    theme: "light",
    placement: "header",
    buttonStyle: "primary",
  },
  zoho: {
    orgId: process.env.NEXT_PUBLIC_ZOHO_ORG_ID || "",
    departmentId: process.env.NEXT_PUBLIC_ZOHO_DEPT_ID || "",
    portalUrl:
      process.env.NEXT_PUBLIC_ZOHO_PORTAL_URL || "https://desk.zoho.in",
    customFields: {},
  },
  categories: [
    { id: "general", label: "General Support" },
    { id: "technical", label: "Technical Issues" },
    { id: "account", label: "Account Issues" },
  ],
};

export const APP_CONFIGS: Record<string, AppConfig> = {
  "learner-web-app": {
    appName: "learner-web-app",
    features: {
      ticketCreation: true,
      csvExport: false,
      ticketManagement: false,
    },
    roles: {
      canCreateTicket: ["learner", "student"],
      canExportData: [],
      canManageTickets: [],
    },
    ui: {
      theme: "light",
      placement: "header",
      buttonStyle: "primary",
    },
    zoho: {
      orgId: process.env.NEXT_PUBLIC_LEARNER_ZOHO_ORG_ID || "",
      departmentId: process.env.NEXT_PUBLIC_LEARNER_DEPT_ID || "",
      portalUrl:
        process.env.NEXT_PUBLIC_ZOHO_PORTAL_URL || "https://desk.zoho.in",
      customFields: {
        cf_app_source: "learner-web-app",
        cf_user_type: "learner",
      },
    },
    categories: [
      { id: "technical", label: "Technical Issues" },
      { id: "content", label: "Content Related" },
      { id: "account", label: "Account Issues" },
      { id: "course", label: "Course Access" },
    ],
  },
  teachers: {
    appName: "teachers",
    features: {
      ticketCreation: true,
      csvExport: false,
      ticketManagement: false,
    },
    roles: {
      canCreateTicket: ["teacher", "facilitator"],
      canExportData: [],
      canManageTickets: [],
    },
    ui: {
      theme: "light",
      placement: "dashboard",
      buttonStyle: "secondary",
    },
    zoho: {
      orgId: process.env.NEXT_PUBLIC_TEACHER_ZOHO_ORG_ID || "",
      departmentId: process.env.NEXT_PUBLIC_TEACHER_DEPT_ID || "",
      portalUrl:
        process.env.NEXT_PUBLIC_ZOHO_PORTAL_URL || "https://desk.zoho.in",
      customFields: {
        cf_app_source: "teachers",
        cf_user_type: "teacher",
      },
    },
    categories: [
      { id: "course", label: "Course Management" },
      { id: "student", label: "Student Issues" },
      { id: "technical", label: "Technical Support" },
      { id: "content", label: "Content Creation" },
    ],
  },
  "admin-app-repo": {
    appName: "admin-app-repo",
    features: {
      ticketCreation: true,
      csvExport: true,
      ticketManagement: true,
    },
    roles: {
      canCreateTicket: ["admin", "central_admin"],
      canExportData: ["admin", "central_admin"],
      canManageTickets: ["admin", "central_admin"],
    },
    ui: {
      theme: "dark",
      placement: "sidebar",
      buttonStyle: "primary",
    },
    zoho: {
      orgId: process.env.NEXT_PUBLIC_ADMIN_ZOHO_ORG_ID || "",
      departmentId: process.env.NEXT_PUBLIC_ADMIN_DEPT_ID || "",
      portalUrl:
        process.env.NEXT_PUBLIC_ZOHO_PORTAL_URL || "https://desk.zoho.in",
      customFields: {
        cf_app_source: "admin-app-repo",
        cf_user_type: "admin",
      },
    },
    categories: [
      { id: "system", label: "System Administration" },
      { id: "user-management", label: "User Management" },
      { id: "data", label: "Data Issues" },
      { id: "technical", label: "Technical Support" },
    ],
  },
};

export const DEFAULT_ROLE_CONFIG: RoleConfig = {
  role: "user",
  permissions: {
    createTicket: true,
    viewTickets: false,
    exportTickets: false,
    manageTickets: false,
  },
  dataAccess: {
    ownTicketsOnly: true,
    departmentTickets: false,
    allTickets: false,
  },
};

export const ROLE_CONFIGS: Record<string, Record<string, RoleConfig>> = {
  "learner-web-app": {
    learner: {
      role: "learner",
      permissions: {
        createTicket: true,
        viewTickets: true,
        exportTickets: false,
        manageTickets: false,
      },
      dataAccess: {
        ownTicketsOnly: true,
        departmentTickets: false,
        allTickets: false,
      },
    },
    student: {
      role: "student",
      permissions: {
        createTicket: true,
        viewTickets: true,
        exportTickets: false,
        manageTickets: false,
      },
      dataAccess: {
        ownTicketsOnly: true,
        departmentTickets: false,
        allTickets: false,
      },
    },
  },
  teachers: {
    teacher: {
      role: "teacher",
      permissions: {
        createTicket: true,
        viewTickets: true,
        exportTickets: false,
        manageTickets: false,
      },
      dataAccess: {
        ownTicketsOnly: true,
        departmentTickets: true,
        allTickets: false,
      },
    },
    facilitator: {
      role: "facilitator",
      permissions: {
        createTicket: true,
        viewTickets: true,
        exportTickets: false,
        manageTickets: false,
      },
      dataAccess: {
        ownTicketsOnly: true,
        departmentTickets: true,
        allTickets: false,
      },
    },
  },
  "admin-app-repo": {
    admin: {
      role: "admin",
      permissions: {
        createTicket: true,
        viewTickets: true,
        exportTickets: true,
        manageTickets: true,
      },
      dataAccess: {
        ownTicketsOnly: false,
        departmentTickets: true,
        allTickets: true,
      },
    },
    central_admin: {
      role: "central_admin",
      permissions: {
        createTicket: true,
        viewTickets: true,
        exportTickets: true,
        manageTickets: true,
      },
      dataAccess: {
        ownTicketsOnly: false,
        departmentTickets: true,
        allTickets: true,
      },
    },
  },
};

export const ZOHO_FIELD_MAPPING = {
  email: "zd_email",
  phone: "zd_phone",
  subject: "zd_subject",
  description: "zd_description",
  department: "zd_departmentid",
  category: "zd_category",
  priority: "zd_priority",
};

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export const API_ENDPOINTS = {
  TICKETS: {
    LOG: "/api/tickets/log",
    LIST: "/api/tickets/list",
    EXPORT: "/api/tickets/export",
    WEBHOOK: "/api/tickets/webhook",
  },
  USER: {
    PROFILE: "/api/user/profile",
  },
  EXPORT: {
    PROGRESS: "/api/export/progress",
    HISTORY: "/api/export/history",
    DOWNLOAD: "/api/export/download",
  },
};
