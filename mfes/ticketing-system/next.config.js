// const { NextFederationPlugin } = require("@module-federation/nextjs-mf");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  basePath: "/mfe_ticketing", // This should match the path set in Nginx
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    esmExternals: false,
  },

  async rewrites() {
    const rewrites = [];

    // Only add rewrites if environment variables are defined
    if (process.env.NEXT_PUBLIC_TELEMETRY_URL) {
      console.log(
        "NEXT_PUBLIC_TELEMETRY_URL",
        process.env.NEXT_PUBLIC_TELEMETRY_URL,
        `${process.env.NEXT_PUBLIC_ZOHO_API_URL}/api/v1/tickets`
      );
      rewrites.push(
        {
          source: "/action/v1/telemetry",
          destination: `${process.env.NEXT_PUBLIC_TELEMETRY_URL}/v1/telemetry`,
        },
        {
          source: "/action/data/v3/telemetry",
          destination: `${process.env.NEXT_PUBLIC_TELEMETRY_URL}/v1/telemetry`,
        },
        {
          source: "/data/v3/telemetry",
          destination: `${process.env.NEXT_PUBLIC_TELEMETRY_URL}/v1/telemetry`,
        }
      );

      // Only add this rewrite if ZOHO_API_URL is defined
      if (process.env.ZOHO_API_URL) {
        rewrites.push({
          source: "/api/v1/tickets",
          destination: `${process.env.ZOHO_API_URL}/tickets`,
        });
      }
    }

    if (process.env.NEXT_PUBLIC_API_BASE_URL) {
      rewrites.push({
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/:path*`,
      });
    }

    // Default telemetry route (local fallback)
    rewrites.push({
      source: "/app/telemetry",
      destination: "/api/telemetry",
    });

    return rewrites;
  },

  // webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
  //   config.plugins.push(
  //     new NextFederationPlugin({
  //       name: "zohoTicketing",
  //       filename: "static/chunks/remoteEntry.js",
  //       exposes: {
  //         // User Components
  //         "./TicketRaiseButton": "./src/components/user/TicketRaiseButton.tsx",
  //         "./TicketForm": "./src/components/user/TicketForm.tsx",
  //         "./TicketSuccess": "./src/components/user/TicketSuccess.tsx",
  //         "./TicketError": "./src/components/user/TicketError.tsx",

  //         // Admin Components
  //         "./TicketExportButton": "./src/components/admin/TicketExportButton.tsx",
  //         "./TicketExportModal": "./src/components/admin/TicketExportModal.tsx",
  //         "./TicketDataTable": "./src/components/admin/TicketDataTable.tsx",
  //         "./TicketManagementDashboard": "./src/components/admin/TicketManagementDashboard.tsx",

  //         // Provider Components
  //         "./TicketingProvider": "./src/components/common/TicketingProvider.tsx",
  //         "./RoleGuard": "./src/components/common/RoleGuard.tsx",
  //         "./ConfigProvider": "./src/components/common/ConfigProvider.tsx",

  //         // Hooks
  //         "./useTicketing": "./src/hooks/useTicketing.ts",
  //         "./useUserRole": "./src/hooks/useUserRole.ts",
  //         "./useAppConfig": "./src/hooks/useAppConfig.ts",

  //         // Complete Modules
  //         "./UserTicketing": "./src/modules/UserTicketing.tsx",
  //         "./AdminTicketing": "./src/modules/AdminTicketing.tsx",

  //         // Services
  //         "./ticketService": "./src/services/ticketService.ts",
  //         "./configService": "./src/services/configService.ts",
  //         "./exportService": "./src/services/exportService.ts",
  //       },
  //       shared: {
  //         react: {
  //           singleton: true,
  //           requiredVersion: "^18.3.1",
  //         },
  //         "react-dom": {
  //           singleton: true,
  //           requiredVersion: "^18.3.1",
  //         },
  //         "@mui/material": {
  //           singleton: true,
  //           requiredVersion: "^5.15.21",
  //         },
  //         "@mui/icons-material": {
  //           singleton: true,
  //           requiredVersion: "^5.15.15",
  //         },
  //         "axios": {
  //           singleton: true,
  //           requiredVersion: "^1.6.8",
  //         },
  //         "zustand": {
  //           singleton: true,
  //           requiredVersion: "^4.5.4",
  //         },
  //       },
  //     })
  //   );

  //   return config;
  // },
};

module.exports = nextConfig;
