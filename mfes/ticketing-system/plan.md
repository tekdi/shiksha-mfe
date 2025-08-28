# Frontend Plan for Zoho Desk Integration - Reusable MFE

## 1. **MFE Architecture Overview**

We'll create **one unified, reusable MFE** following the existing project pattern:

**`ticketing`** - A comprehensive, configurable MFE that supports:

- End user ticket creation
- Admin CSV export functionality
- Role-based feature exposure
- Multi-app integration with different configurations

## 2. **Project Structure**

```
mfes/
└── ticketing/                 # Unified reusable ticketing MFE
    ├── src/
    │   ├── components/
    │   │   ├── common/
    │   │   │   ├── TicketingProvider.tsx
    │   │   │   ├── RoleGuard.tsx
    │   │   │   └── ConfigProvider.tsx
    │   │   ├── user/
    │   │   │   ├── TicketRaiseButton.tsx
    │   │   │   ├── TicketForm.tsx
    │   │   │   ├── TicketSuccess.tsx
    │   │   │   └── TicketError.tsx
    │   │   ├── admin/
    │   │   │   ├── TicketExportButton.tsx
    │   │   │   ├── TicketExportModal.tsx
    │   │   │   ├── TicketDataTable.tsx
    │   │   │   └── ExportProgress.tsx
    │   │   └── index.ts
    │   ├── pages/
    │   │   ├── index.tsx
    │   │   ├── raise-ticket.tsx
    │   │   └── ticket-management.tsx
    │   ├── services/
    │   │   ├── ticketService.ts
    │   │   ├── exportService.ts
    │   │   ├── userService.ts
    │   │   └── configService.ts
    │   ├── utils/
    │   │   ├── zohoUrlBuilder.ts
    │   │   ├── csvGenerator.ts
    │   │   ├── dateUtils.ts
    │   │   ├── roleUtils.ts
    │   │   └── constants.ts
    │   ├── types/
    │   │   ├── ticket.types.ts
    │   │   ├── export.types.ts
    │   │   ├── config.types.ts
    │   │   └── user.types.ts
    │   ├── hooks/
    │   │   ├── useTicketing.ts
    │   │   ├── useUserRole.ts
    │   │   └── useAppConfig.ts
    │   └── store/
    │       ├── ticketingStore.ts
    │       └── configStore.ts
    ├── next.config.js
    ├── project.json
    └── module.config.js
```

## 3. **Reusable Component Architecture**

### **3.1 Core Provider Components**

**TicketingProvider.tsx**

- Central context provider for the entire ticketing system
- Manages app-specific configuration
- Handles role-based feature access
- Provides unified state management

**ConfigProvider.tsx**

- App-specific configuration management
- Environment-based settings
- Feature flags and permissions
- Zoho Desk integration settings

**RoleGuard.tsx**

- Role-based component rendering
- Permission checking
- Feature access control
- Cross-app role mapping

### **3.2 User Components (Reusable)**

**TicketRaiseButton.tsx**

- Configurable button styles and placement
- App-specific categorization
- Context-aware user data prefilling
- Customizable triggers and flows

**TicketForm.tsx**

- Dynamic form fields based on app config
- Multi-tenant user data handling
- Configurable validation rules
- App-specific custom fields

**TicketSuccess.tsx**

- Configurable success messages
- App-specific next steps
- Custom branding support
- Contextual guidance

**TicketError.tsx**

- Configurable error handling
- App-specific retry mechanisms
- Custom support contact info
- Fallback options

### **3.3 Admin Components (Reusable)**

**TicketExportButton.tsx**

- Role-based visibility
- App-specific export permissions
- Configurable export triggers
- Multi-tenant data filtering

**TicketExportModal.tsx**

- Configurable filter options
- App-specific data fields
- Role-based export restrictions
- Custom date range settings

**TicketDataTable.tsx**

- Configurable column display
- App-specific data formatting
- Role-based data access
- Customizable pagination

**ExportProgress.tsx**

- Universal progress tracking
- Configurable status messages
- App-specific error handling
- Custom completion actions

## 4. **Configuration System**

### **4.1 App-Specific Configuration**

```typescript
interface AppConfig {
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
    placement: "header" | "sidebar" | "floating" | "footer";
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
```

### **4.2 Role-Based Access Control**

```typescript
interface RoleConfig {
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
```

## 5. **Multi-App Integration Strategy**

### **5.1 Learner Web App Integration**

```tsx
// In learner-web-app
import { TicketRaiseButton, TicketingProvider } from "ticketing";

const learnerConfig = {
  appName: "learner-web-app",
  features: { ticketCreation: true, csvExport: false },
  roles: { canCreateTicket: ["learner", "student"] },
  categories: [
    { id: "technical", label: "Technical Issues" },
    { id: "content", label: "Content Related" },
    { id: "account", label: "Account Issues" },
  ],
};

<TicketingProvider config={learnerConfig}>
  <TicketRaiseButton placement="header" />
</TicketingProvider>;
```

### **5.2 Teachers App Integration**

```tsx
// In teachers app
import { TicketRaiseButton, TicketingProvider } from "ticketing";

const teacherConfig = {
  appName: "teachers",
  features: { ticketCreation: true, csvExport: false },
  roles: { canCreateTicket: ["teacher", "facilitator"] },
  categories: [
    { id: "course", label: "Course Management" },
    { id: "student", label: "Student Issues" },
    { id: "technical", label: "Technical Support" },
  ],
};

<TicketingProvider config={teacherConfig}>
  <TicketRaiseButton placement="dashboard" />
</TicketingProvider>;
```

### **5.3 Admin App Integration**

```tsx
// In admin-app-repo
import {
  TicketExportButton,
  TicketManagementDashboard,
  TicketingProvider,
} from "ticketing";

const adminConfig = {
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
};

<TicketingProvider config={adminConfig}>
  <TicketExportButton />
  <TicketManagementDashboard />
</TicketingProvider>;
```

## 6. **Technical Implementation Details**

### **6.1 Module Federation Setup**

**ticketing/next.config.js**

```javascript
const NextFederationPlugin = require("@module-federation/nextjs-mf");

module.exports = {
  webpack: (config, options) => {
    config.plugins.push(
      new NextFederationPlugin({
        name: "zohoTicketing",
        filename: "static/chunks/remoteEntry.js",
        exposes: {
          // User Components
          "./TicketRaiseButton": "./src/components/user/TicketRaiseButton.tsx",
          "./TicketForm": "./src/components/user/TicketForm.tsx",

          // Admin Components
          "./TicketExportButton":
            "./src/components/admin/TicketExportButton.tsx",
          "./TicketManagementDashboard":
            "./src/components/admin/TicketManagementDashboard.tsx",

          // Provider Components
          "./TicketingProvider":
            "./src/components/common/TicketingProvider.tsx",

          // Hooks
          "./useTicketing": "./src/hooks/useTicketing.ts",

          // Complete Modules
          "./UserTicketing": "./src/modules/UserTicketing.tsx",
          "./AdminTicketing": "./src/modules/AdminTicketing.tsx",
        },
      })
    );
    return config;
  },
};
```

### **6.2 State Management (Zustand)**

**ticketingStore.ts**

```typescript
interface TicketingStore {
  // Configuration
  appConfig: AppConfig | null;
  setAppConfig: (config: AppConfig) => void;

  // User Data
  currentUser: UserData | null;
  setCurrentUser: (user: UserData) => void;

  // Ticket Data
  tickets: Ticket[];
  setTickets: (tickets: Ticket[]) => void;

  // UI State
  isTicketFormOpen: boolean;
  isExportModalOpen: boolean;
  setTicketFormOpen: (open: boolean) => void;
  setExportModalOpen: (open: boolean) => void;

  // Methods
  createTicket: (ticketData: TicketSubmission) => Promise<void>;
  exportTickets: (filters: ExportFilters) => Promise<void>;
  loadUserTickets: () => Promise<void>;
}
```

### **6.3 Custom Hooks**

**useTicketing.ts**

```typescript
export const useTicketing = () => {
  const store = useTicketingStore();
  const { appConfig } = store;

  const canCreateTicket = useMemo(() => {
    return checkPermission("createTicket", appConfig, currentUser);
  }, [appConfig, currentUser]);

  const canExportData = useMemo(() => {
    return checkPermission("exportData", appConfig, currentUser);
  }, [appConfig, currentUser]);

  return {
    canCreateTicket,
    canExportData,
    createTicket: store.createTicket,
    exportTickets: store.exportTickets,
    // ... other methods
  };
};
```

## 7. **Service Layer (Reusable)**

### **7.1 Configuration Service**

**configService.ts**

```typescript
export class ConfigService {
  static getAppConfig(appName: string): AppConfig {
    return APP_CONFIGS[appName] || DEFAULT_CONFIG;
  }

  static getZohoConfig(appName: string): ZohoConfig {
    const appConfig = this.getAppConfig(appName);
    return {
      baseUrl: appConfig.zoho.portalUrl + "/portal/newticket",
      fields: {
        email: "zd_email",
        phone: "zd_phone",
        subject: "zd_subject",
        description: "zd_description",
        department: appConfig.zoho.departmentId,
        ...appConfig.zoho.customFields,
      },
    };
  }

  static getRolePermissions(role: string, appName: string): RoleConfig {
    const appConfig = this.getAppConfig(appName);
    return ROLE_CONFIGS[appName][role] || DEFAULT_ROLE_CONFIG;
  }
}
```

### **7.2 Universal Ticket Service**

**ticketService.ts**

```typescript
export class TicketService {
  static async createTicket(
    ticketData: TicketSubmission,
    appConfig: AppConfig
  ): Promise<TicketResponse> {
    // Log ticket submission to backend
    await this.logTicketSubmission(ticketData, appConfig.appName);

    // Build Zoho URL with app-specific configuration
    const zohoUrl = this.buildZohoUrl(ticketData, appConfig);

    // Redirect to Zoho Desk
    window.open(zohoUrl, "_blank");

    return { success: true, ticketId: generateTicketId() };
  }

  static buildZohoUrl(
    ticketData: TicketSubmission,
    appConfig: AppConfig
  ): string {
    const zohoConfig = ConfigService.getZohoConfig(appConfig.appName);
    const params = new URLSearchParams();

    // Add standard fields
    params.append(zohoConfig.fields.email, ticketData.email);
    params.append(zohoConfig.fields.phone, ticketData.phone);
    params.append(zohoConfig.fields.subject, ticketData.subject);
    params.append(zohoConfig.fields.description, ticketData.description);
    params.append(zohoConfig.fields.department, zohoConfig.fields.department);

    // Add app-specific custom fields
    Object.entries(appConfig.zoho.customFields).forEach(([key, value]) => {
      params.append(key, value);
    });

    return `${zohoConfig.baseUrl}?${params.toString()}`;
  }
}
```

## 8. **UI/UX Specifications**

### **8.1 Responsive Design System**

```typescript
interface ThemeConfig {
  components: {
    TicketButton: {
      variants: {
        fab: ComponentProps;
        header: ComponentProps;
        sidebar: ComponentProps;
      };
    };
    TicketForm: {
      layout: "modal" | "page" | "drawer";
      width: "sm" | "md" | "lg" | "xl";
    };
  };
}
```

### **8.2 Configurable User Flows**

**Dynamic Flow Configuration:**

```typescript
interface FlowConfig {
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
```

## 9. **Environment Configuration**

### **9.1 Multi-Environment Support**

```env
# Base Configuration
NEXT_PUBLIC_ZOHO_BASE_URL=https://desk.zoho.com
NEXT_PUBLIC_API_BASE_URL=https://api.yourapp.com

# App-Specific Configurations
NEXT_PUBLIC_LEARNER_ZOHO_ORG_ID=learner_org_id
NEXT_PUBLIC_LEARNER_DEPT_ID=learner_support_dept

NEXT_PUBLIC_TEACHER_ZOHO_ORG_ID=teacher_org_id
NEXT_PUBLIC_TEACHER_DEPT_ID=teacher_support_dept

NEXT_PUBLIC_ADMIN_ZOHO_ORG_ID=admin_org_id
NEXT_PUBLIC_ADMIN_DEPT_ID=admin_support_dept

# Feature Flags
NEXT_PUBLIC_ENABLE_TICKET_ATTACHMENTS=true
NEXT_PUBLIC_ENABLE_EXPORT_SCHEDULING=false
NEXT_PUBLIC_ENABLE_REAL_TIME_UPDATES=true
```

## 10. **Development Phases**

### **Phase 1: Core MFE Setup**

- [ ] Setup unified MFE structure
- [ ] Implement configuration system
- [ ] Create provider components
- [ ] Setup state management
- [ ] Implement role-based access control

### **Phase 2: User Features**

- [ ] Implement configurable ticket creation
- [ ] Build dynamic form system
- [ ] Add app-specific categorization
- [ ] Implement success/error handling
- [ ] Add multi-app user data handling

### **Phase 3: Admin Features**

- [ ] Implement configurable CSV export
- [ ] Build data filtering system
- [ ] Add role-based data access
- [ ] Implement export scheduling
- [ ] Add ticket management dashboard

### **Phase 4: Integration & Testing**

- [ ] Integrate with learner-web-app
- [ ] Integrate with teachers app
- [ ] Integrate with admin-app-repo
- [ ] Cross-app compatibility testing
- [ ] Performance optimization
- [ ] Documentation and examples

## 11. **Integration Examples**

### **11.1 Simple Integration (Learner App)**

```tsx
import { TicketRaiseButton } from "ticketing/TicketRaiseButton";

// Minimal integration with default config
<TicketRaiseButton
  appName="learner-web-app"
  userRole="learner"
  placement="header"
/>;
```

### **11.2 Advanced Integration (Admin App)**

```tsx
import {
  TicketingProvider,
  TicketManagementDashboard,
  TicketExportButton,
} from "ticketing";

const customConfig = {
  appName: "admin-app-repo",
  features: { csvExport: true, ticketManagement: true },
  ui: { theme: "dark", placement: "sidebar" },
  export: {
    defaultFilters: { dateRange: "30days" },
    autoRefresh: true,
    formats: ["csv", "excel"],
  },
};

<TicketingProvider config={customConfig}>
  <div className="admin-ticket-section">
    <TicketExportButton variant="outlined" />
    <TicketManagementDashboard />
  </div>
</TicketingProvider>;
```

### **11.3 Custom Hook Integration**

```tsx
import { useTicketing } from "ticketing/useTicketing";

const MyComponent = () => {
  const { canCreateTicket, canExportData, createTicket, tickets } =
    useTicketing();

  if (!canCreateTicket) return null;

  return (
    <div>
      <button onClick={() => createTicket(ticketData)}>
        Raise Support Ticket
      </button>
      {canExportData && <button onClick={exportTickets}>Export Tickets</button>}
    </div>
  );
};
```

## 12. **Dependencies & Libraries**

```json
{
  "dependencies": {
    "@mui/material": "^5.15.21",
    "@mui/icons-material": "^5.15.15",
    "@mui/x-date-pickers": "^7.10.0",
    "axios": "^1.6.8",
    "react-hook-form": "^7.54.2",
    "zustand": "^4.5.4",
    "date-fns": "^3.6.0",
    "papaparse": "^5.4.1",
    "react-hot-toast": "^2.4.1",
    "react-query": "^3.39.3",
    "lodash": "^4.17.21"
  }
}
```

---

This comprehensive reusable MFE plan provides a unified, configurable solution that can be integrated across all applications with app-specific configurations, role-based access control, and feature customization while maintaining code reusability and consistency.
