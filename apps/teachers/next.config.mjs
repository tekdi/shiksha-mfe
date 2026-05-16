//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires

import { composePlugins, withNx } from '@nx/next';
import nextI18nextConfig from './next-i18next.config.js';

const PORTAL_BASE_URL = 'https://sunbird-editor.tekdinext.com';

const routes = {
  API: {
    GENERAL: {
      CONTENT_PREVIEW: '/content/preview/:path*',
      CONTENT_PLUGINS: '/content-plugins/:path*',
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

  //cross import support
  transpilePackages: ['@shared-lib-v2', 'firebase', 'date-fns'],

  // @ts-ignore
  i18n: nextI18nextConfig.i18n,

  async rewrites() {
    return [
      {
        source: '/assets/pdfjs/:path*', // Match any URL starting with /workspace/content/assets/
        destination: `${process.env.NEXT_PUBLIC_WORKSPACE_BASE_URL}/assets/pdfjs/:path*`, // Serve the assets from the public folder
      },
      {
        source: '/play/content/assets/pdfjs/:path*', // Match any URL starting with /workspace/content/assets/
        destination: `${process.env.NEXT_PUBLIC_WORKSPACE_BASE_URL}/assets/pdfjs/:path*`, // Serve the assets from the public folder
      },
      {
        source: '/play/content/assets/:path*', // Match any URL starting with /workspace/content/assets/
        destination: `${process.env.NEXT_PUBLIC_WORKSPACE_BASE_URL}/assets/:path*`, // Serve the assets from the public folder
      },
      {
        source: `/action/v1/telemetry`,
        destination: `${process.env.NEXT_PUBLIC_TELEMETRY_URL}/v1/telemetry`,
      },
      {
        source: '/action/asset/:path*', // Match other /action/asset routes
        destination: `${process.env.NEXT_PUBLIC_WORKSPACE_BASE_URL}/api/proxy?path=/action/asset/:path*`, // Forward other /action/asset requests to proxy.js
      },
      {
        source: '/action/content/:path*', // Match other /action/asset routes
        destination: `${process.env.NEXT_PUBLIC_WORKSPACE_BASE_URL}/api/proxy?path=/action/content/:path*`, // Forward other /action/asset requests to proxy.js
      },
      {
        source: '/action/:path*', // Match any other routes starting with /action/
        destination: `${process.env.NEXT_PUBLIC_WORKSPACE_BASE_URL}/api/proxy?path=/action/:path*`, // Forward them to proxy.js
      },
      {
        source: '/api/:path*', // Match /api/ routes
        destination: `${process.env.NEXT_PUBLIC_WORKSPACE_BASE_URL}/api/proxy?path=/api/:path*`, // Forward them to proxy.js
      },
      {
        source: '/assets/public/:path*', // Match any URL starting with /assets/public/
        destination: `${process.env.NEXT_PUBLIC_CLOUD_STORAGE_URL}/:path*`, // Forward to workspace proxy
      },

      {
        source: '/app/telemetry', // Match telemetry route
        destination: `${process.env.NEXT_PUBLIC_WORKSPACE_BASE_URL}/api/telemetry`, // Redirect to telemetry proxy
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
        source: '/sunbird-plugins/renderer/:path*',
        destination: `${process.env.NEXT_PUBLIC_WORKSPACE_BASE_URL}/sunbird-plugins/renderer/:path*`,
      },
      {
        source: '/scp-teacher-repo/:path*',
        destination: 'http://localhost:4102/scp-teacher-repo/:path*',
      },
      {
        source: '/youthnet/:path*',
        destination: 'http://localhost:4103/youthnet/:path*',
      },
      {
        source: '/sbplayer/:path*',
        destination: 'http://localhost:4107/sbplayer/:path*',
      },
    ];
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

export default composePlugins(...plugins)(nextConfig);
