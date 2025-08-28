/**
 * @typedef {Object} ConfigFeature
 * @property {string[]} skippedFeatures
 * @property {Object} features
 * @property {Object} features.ticketing
 * @property {string[]} features.ticketing.pages
 * @property {Object[]} features.ticketing.components
 * @property {string} features.ticketing.components[].name
 * @property {string} features.ticketing.components[].path
 * @property {string[]} [skippedComponents] // Optional property
 * @property {function(string): void} includes
 */

/**
 * @type {ConfigFeature}
 */
const configFeatures = {
  skippedFeatures: [""],
  features: {
    UserTicketing: {
      pages: ["./src/pages/index.tsx", "./src/pages/raise-ticket.tsx"],
      components: [
        {
          name: "TicketRaiseButton",
          path: "./src/components/user/TicketRaiseButton.tsx",
        },
        {
          name: "TicketForm",
          path: "./src/components/user/TicketForm.tsx",
        },
        {
          name: "TicketSuccess",
          path: "./src/components/user/TicketSuccess.tsx",
        },
        {
          name: "TicketError",
          path: "./src/components/user/TicketError.tsx",
        },
        {
          name: "HeaderTicketButton",
          path: "./src/components/user/TicketRaiseButton.tsx",
        },
        {
          name: "SidebarTicketButton",
          path: "./src/components/user/TicketRaiseButton.tsx",
        },
        {
          name: "FloatingTicketButton",
          path: "./src/components/user/TicketRaiseButton.tsx",
        },
        {
          name: "DashboardTicketButton",
          path: "./src/components/user/TicketRaiseButton.tsx",
        },
      ],
    },
    AdminTicketing: {
      pages: ["./src/pages/ticket-management.tsx"],
      components: [
        {
          name: "TicketExportButton",
          path: "./src/components/admin/TicketExportButton.tsx",
        },
        {
          name: "TicketExportModal",
          path: "./src/components/admin/TicketExportModal.tsx",
        },
        {
          name: "TicketDataTable",
          path: "./src/components/admin/TicketDataTable.tsx",
        },
        {
          name: "TicketManagementDashboard",
          path: "./src/components/admin/TicketManagementDashboard.tsx",
        },
        {
          name: "ExportProgress",
          path: "./src/components/admin/ExportProgress.tsx",
        },
      ],
    },
    CommonTicketing: {
      pages: [],
      components: [
        {
          name: "TicketingProvider",
          path: "./src/components/common/TicketingProvider.tsx",
        },
        {
          name: "RoleGuard",
          path: "./src/components/common/RoleGuard.tsx",
        },
        {
          name: "ConfigProvider",
          path: "./src/components/common/ConfigProvider.tsx",
        },
      ],
    },
    TicketingHooks: {
      pages: [],
      components: [
        {
          name: "useTicketing",
          path: "./src/hooks/useTicketing.ts",
        },
        {
          name: "useUserRole",
          path: "./src/hooks/useUserRole.ts",
        },
        {
          name: "useAppConfig",
          path: "./src/hooks/useAppConfig.ts",
        },
      ],
    },
    TicketingServices: {
      pages: [],
      components: [
        {
          name: "TicketService",
          path: "./src/services/ticketService.ts",
        },
        {
          name: "ConfigService",
          path: "./src/services/configService.ts",
        },
        {
          name: "ExportService",
          path: "./src/services/exportService.ts",
        },
        {
          name: "UserService",
          path: "./src/services/userService.ts",
        },
      ],
    },
  },
  includes: function (componentName) {
    // Add any custom logic for including components
    return true;
  },
};

/**
 * @param {ConfigFeature} config
 * @returns {string[]}
 */
const extractSkippedComponents = (config) => {
  const skippedComponents = [];

  Object.keys(config.features).forEach((featureKey) => {
    const feature = config.features[featureKey];

    if (feature.components) {
      feature.components.forEach((component) => {
        if (component.name) {
          skippedComponents.push(component.name);
        }
      });
    }
  });

  return skippedComponents;
};

// Extract and add skipped components to the config
configFeatures.skippedComponents = extractSkippedComponents(configFeatures);

module.exports = configFeatures;
