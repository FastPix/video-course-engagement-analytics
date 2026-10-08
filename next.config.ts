import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Do not advertise the framework in an X-Powered-By header.
  poweredByHeader: false,
  // Hide the Next.js "N" dev indicator: it sits over the sidebar footer. Dev only; build errors still show as an overlay.
  devIndicators: false,
  // The Actions page was removed (S13). Old links land on Learners.
  redirects: async () => [{ source: '/actions', destination: '/learners', permanent: false }],
  // Browser automation writes into .playwright-mcp while the dev server runs. Watching it causes endless rebuilds.
  webpack: config => {
    config.watchOptions = { ...config.watchOptions, ignored: ['**/node_modules/**', '**/.playwright-mcp/**'] };
    return config;
  },
};

export default nextConfig;
