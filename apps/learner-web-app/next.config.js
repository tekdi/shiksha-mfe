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
  // Traces only the files the server needs into .next/standalone, which keeps the Docker image small
  output: "standalone",
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
    domains: ["program-image-dev.s3.ap-south-1.amazonaws.com","oblf.org"],
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
        source: "/interface/:path*",
        destination: "https://shiksha-dev-interface.tekdinext.com/interface/:path*",
      },
      //for player content v1
      {
        source: routes.API.GENERAL.CONTENT_PREVIEW,
        destination: `${PORTAL_BASE_URL}${routes.API.GENERAL.CONTENT_PREVIEW}`, // Proxy to portal
      },
    ];
  },
};

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
  withPWA,
];

module.exports = composePlugins(...plugins)(nextConfig);