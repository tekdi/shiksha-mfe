//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');
const path = require("path");
const PORTAL_BASE_URL = 'https://sunbird-editor.tekdinext.com';

const CONTENT_EDITOR_BASE_URL = 'https://sunbird-editor.tekdinext.com';
const routes = {
  API: {
    GENERAL: {
      CONTENT_PREVIEW: '/content/preview/:path*',
      CONTENT_PLUGINS: '/content-plugins/:path*',
      GENERIC_EDITOR: '/generic-editor/:path*',
      CONTENT_EDITOR: '/content-editor/:path*',
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
  basePath: '/mfe_workspace',
  webpack: (config) => {
    // Add path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      "@workspace": path.resolve(__dirname, "src"),
      "@scp-teacher-repo": path.resolve(__dirname, "../scp-teacher-repo/src"),
    };
    return config;
  }, // This should match the path set in Nginx
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
      {
        source: '/action/:path*', // Match any other routes starting with /action/
        destination: '/api/proxy?path=/action/:path*', // Forward them to proxy.js
      },
      {
        source: '/api/:path*', // Match /api/ routes
        destination: '/api/proxy?path=/api/:path*', // Forward them to proxy.js
      },
      {
        source: '/assets/public/:path*', // Match any URL starting with /assets/public/
        destination: '/api/s3-assets?path=:path*', // Forward to S3 assets API with authentication
      },
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
      {
        source: routes.API.GENERAL.GENERIC_EDITOR,
        destination: `${PORTAL_BASE_URL}/:path*`, // Proxy to generic editor portal
      },
      {
        source: routes.API.GENERAL.CONTENT_EDITOR,
        destination: `${CONTENT_EDITOR_BASE_URL}/:path*`, // Proxy to generic editor portal
      },
      {
        source: '/app/telemetry', // Match telemetry route
        destination: '/api/telemetry', // Redirect to telemetry proxy
      },
      {
        source: '/content-editor/telemetry', // Match telemetry route
        destination: '/api/telemetry', // Redirect to telemetry proxy
      },
    ];
  },

  
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
