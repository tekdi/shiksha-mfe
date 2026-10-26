/** @type {import('next').NextConfig} */
import nextI18nextConfig from './next-i18next.config.js';

const nextConfig = {
  output: 'standalone',
  typescript: {
    // Fail the build on type errors so runtime crashes are caught before deploy
    ignoreBuildErrors: false,
  },
  eslint: {
    // Lint runs through the workspace ESLint 9 config (nx lint / SonarCloud); Next's built-in
    // runner cannot load the legacy .eslintrc with ESLint 9, so it is skipped during `next build`.
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@shared-lib-v2/*'],
  trailingSlash: false,
  reactStrictMode: true,
  i18n: nextI18nextConfig.i18n,
  images: {
    unoptimized: true,
  },
  experimental: {
    esmExternals: false,
  },
  async rewrites() {
    return [
      {
        source: '/action/v1/telemetry',
        destination: `${process.env.NEXT_PUBLIC_TELEMETRY_URL || 'https://telemetry.tekdinext.com'}/v1/telemetry`,
      },
      {
        source: '/action/data/v3/telemetry',
        destination: `${process.env.NEXT_PUBLIC_TELEMETRY_URL || 'https://telemetry.tekdinext.com'}/v1/telemetry`,
      },
      {
        source: '/data/v3/telemetry',
        destination: `${process.env.NEXT_PUBLIC_TELEMETRY_URL || 'https://telemetry.tekdinext.com'}/v1/telemetry`,
      },
      ...(process.env.CLOUD_STORAGE_URL
        ? [
            {
              source: '/assets/public/:path*',
              destination: `${process.env.CLOUD_STORAGE_URL}/:path*`,
            },
          ]
        : []),
    ];
  },
};

export default nextConfig;
