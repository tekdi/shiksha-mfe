/** @type {import('next').NextConfig} */
import nextI18nextConfig from './next-i18next.config.js';

const PORTAL_BASE_URL = "https://sunbird-editor.tekdinext.com";
// const PORTAL_BASE_URL = 'http://localhost:3002/mfe_workspace';

const routes = {
  API: {
    GENERAL: {
      CONTENT_PREVIEW: '/content/preview/:path*',
      CONTENT_PLUGINS: '/content-plugins/:path*',
      GENERIC_EDITOR: '/generic-editor/:path*',
    },
  },
};

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  //cross import support
  transpilePackages: ['@shared-lib-v2/*'],

  trailingSlash: false,
  reactStrictMode: true,
  i18n: nextI18nextConfig.i18n,
  distDir: 'build',
  images: {
    unoptimized: true,
  },
  experimental: {
    esmExternals: false,
  },
  async rewrites() {
    return [
      {
        source: '/action/asset/v1/upload/:identifier*',
        destination: '/api/fileUpload',
      },
      {
        source: '/assets/pdfjs/:path*',
        destination: `${process.env.NEXT_PUBLIC_WORKSPACE_BASE_URL}/assets/pdfjs/:path*`,
      },
      {
        source: '/play/content/assets/pdfjs/:path*',
        destination: `${process.env.NEXT_PUBLIC_WORKSPACE_BASE_URL}/assets/pdfjs/:path*`,
      },
      {
        source: '/play/content/assets/:path*',
        destination: `${process.env.NEXT_PUBLIC_WORKSPACE_BASE_URL}/assets/:path*`,
      },
      {
        source: '/action/content/v3/upload/url/:identifier*',
        destination: `${process.env.NEXT_PUBLIC_WORKSPACE_BASE_URL}/api/proxy?path=/action/content/v3/upload/url/:identifier*`,
      },
      {
        source: '/action/content/v3/upload/:identifier*',
        destination: '/api/fileUpload',
      },
      {
        source: '/workspace/content/assets/:path*',
        destination: `${process.env.NEXT_PUBLIC_WORKSPACE_BASE_URL}/assets/:path*`,
      },
      {
        source: '/action/asset/:path*',
        destination: `${process.env.NEXT_PUBLIC_WORKSPACE_BASE_URL}/api/proxy?path=/action/asset/:path*`,
      },
      {
        source: '/mfe_workspace/assets/:path*', // Match all requests under /mfe_workspace/assets
        destination: '/mfe_workspace/assets/:path*', // Serve from public/
      },
      ...(process.env.NEXT_PUBLIC_TELEMETRY_URL ? [
        {
          source: '/action/v1/telemetry',
          destination: `${process.env.NEXT_PUBLIC_TELEMETRY_URL}/v1/telemetry`,
        },
        {
          source: '/action/data/v3/telemetry',
          destination: `${process.env.NEXT_PUBLIC_TELEMETRY_URL}/v1/telemetry`,
        },
        {
          source: '/data/v3/telemetry',
          destination: `${process.env.NEXT_PUBLIC_TELEMETRY_URL}/v1/telemetry`,
        },
      ] : []),
      {
        source: '/action/content/:path*',
        destination: `${process.env.NEXT_PUBLIC_WORKSPACE_BASE_URL}/api/proxy?path=/action/content/:path*`,
      },
      {
        source: '/api/tenantConfig/:path*',
        destination: `${process.env.NEXT_PUBLIC_WORKSPACE_BASE_URL}/api/tenantConfig/:path*`,
      },
      {
        source: '/action/:path*',
        destination: `${process.env.NEXT_PUBLIC_WORKSPACE_BASE_URL}/api/proxy?path=/action/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_WORKSPACE_BASE_URL}/api/proxy?path=/api/:path*`,
      },
      ...(process.env.CLOUD_STORAGE_URL ? [
        {
          source: '/assets/public/:path*',
          destination: `${process.env.CLOUD_STORAGE_URL}/:path*`,
        },
      ] : []),
      {
        source: routes.API.GENERAL.CONTENT_PREVIEW,
        // destination: `${PORTAL_BASE_URL}${routes.API.GENERAL.CONTENT_PREVIEW}`,
        destination: `${'https://sunbird-editor.tekdinext.com'}${
          routes.API.GENERAL.CONTENT_PREVIEW
        }`,
      },
      {
        source: routes.API.GENERAL.CONTENT_PLUGINS,
        destination: `${PORTAL_BASE_URL}${routes.API.GENERAL.CONTENT_PLUGINS}`,
      },
      {
        source: routes.API.GENERAL.GENERIC_EDITOR,
        destination: `${PORTAL_BASE_URL}/:path*`,
      },
      {
        source: '/sunbird-plugins/renderer/:path*',
        destination: `${process.env.NEXT_PUBLIC_WORKSPACE_BASE_URL}/sunbird-plugins/renderer/:path*`,
      },
      {
        source: '/app/telemetry',
        destination: `${process.env.NEXT_PUBLIC_WORKSPACE_BASE_URL}/api/telemetry`,
      },
    ];
  },
};

export default nextConfig;
