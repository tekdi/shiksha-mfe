//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

const PORTAL_BASE_URL = 'https://sunbird-editor.tekdinext.com';
const basePath = process.env.NEXT_PUBLIC_ASSETS_CONTENT || '/mfe_content';

const routes = {
  API: {
    GENERAL: {
      CONTENT_PREVIEW: '/content/preview/:path*',
      CONTENT_PLUGINS: '/content-plugins/:path*',
      GENERIC_EDITOR: '/generic-editor/:path*',
    },
  },
};

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    // Set this to true if you would like to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false,
  },

  basePath, // This should match the path set in Nginx

  async rewrites() {
    return [
      {
        source: '/action/asset/v1/upload/:identifier*', // Match asset upload routes
        destination: '/api/fileUpload', // Forward asset uploads to fileUpload.js
      },
      {
        source: '/assets/pdfjs/:path*', // Match any URL starting with /workspace/content/assets/
        destination: '/assets/:path*', // Serve the assets from the public folder
      },
      {
        source: '/action/content/v3/upload/url/:identifier*', // Match content upload with 'url' in the path
        destination:
          '/api/proxy?path=/action/content/v3/upload/url/:identifier*', // Forward to proxy route with path as query param
      },
      {
        source: '/action/content/v3/upload/:identifier*', // Match content upload routes
        destination: '/api/fileUpload', // Forward content uploads to fileUpload.js
      },
      {
        source: '/action/asset/:path*', // Match other /action/asset routes
        destination: '/api/proxy?path=/action/asset/:path*', // Forward other /action/asset requests to proxy.js
      },
      {
        source: '/action/content/:path*', // Match other /action/asset routes
        destination: '/api/proxy?path=/action/content/:path*', // Forward other /action/asset requests to proxy.js
      },
      ...(process.env.NEXT_PUBLIC_TELEMETRY_URL ? [
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
        source: '/action/:path*',
        destination: '/api/proxy?path=/action/:path*',
      },
      {
        source: '/api/:path*',
        destination: '/api/proxy?path=/api/:path*',
      },
      ...(process.env.NEXT_PUBLIC_CLOUD_STORAGE_URL ? [
        {
          source: '/assets/public/:path*',
          destination: `${process.env.NEXT_PUBLIC_CLOUD_STORAGE_URL}/:path*`,
        },
      ] : []),
      {
        source: '/workspace/content/assets/:path*', // Match any URL starting with /workspace/content/assets/
        destination: '/assets/:path*', // Serve the assets from the public folder
      },
      {
        source: routes.API.GENERAL.CONTENT_PREVIEW,
        destination: `${PORTAL_BASE_URL}${routes.API.GENERAL.CONTENT_PREVIEW}`, // Proxy to portal
      },
      {
        source: routes.API.GENERAL.CONTENT_PLUGINS,
        destination: `${PORTAL_BASE_URL}${routes.API.GENERAL.CONTENT_PLUGINS}`, // Proxy to portal
      },
    ];
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
