//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require("@nx/next");

const PORTAL_BASE_URL = "https://sunbird-editor.tekdinext.com";

const routes = {
  API: {
    GENERAL: {
      CONTENT_PREVIEW: "/content/preview/:path*",
      CONTENT_PLUGINS: "/content-plugins/:path*",
      GENERIC_EDITOR: "/generic-editor/:path*",
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

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  //cross import support
  transpilePackages: ["@shared-lib-v2/*"],

  images: {
    domains: ["program-image-dev.s3.ap-south-1.amazonaws.com"],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.gstatic.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.s3.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.s3.*.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
  basePath: "",
  webpack: (config, { isServer }) => {
    // Fix for FormData polyfill issue
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        "form-data": false,
      };
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/action/data/v3/telemetry",
        destination: `${process.env.NEXT_PUBLIC_TELEMETRY_URL}/v1/telemetry`,
      },
      {
        source: "/action/v1/telemetry",
        destination: `${process.env.NEXT_PUBLIC_TELEMETRY_URL}/v1/telemetry`,
      },
      {
        source: "/data/v3/telemetry",
        destination: `${process.env.NEXT_PUBLIC_TELEMETRY_URL}/v1/telemetry`,
      },
      {
        source: "/assets/public/:path*", // Match any URL starting with /assets/public/
        destination: `${process.env.NEXT_PUBLIC_CLOUD_STORAGE_URL}/:path*`, // Forward to S3, stripping "/assets/public"
      },
      //for player content v1
      {
        source: routes.API.GENERAL.CONTENT_PREVIEW,
        destination: `${PORTAL_BASE_URL}${routes.API.GENERAL.CONTENT_PREVIEW}`, // Proxy to portal
      },
    ];
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
