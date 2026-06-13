import path from 'path';
import type { NextConfig } from 'next';

const backendUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.BACKEND_API_URL ??
  'http://localhost:3001';

// m07-api runs on port 3001 when unified in monorepo monolith. Use 127.0.0.1 to avoid IPv6 issues.
const m07ApiUrl =
  process.env.M07_API_URL ??
  `http://127.0.0.1:${process.env.M07_API_PORT ?? process.env.PORT ?? '3001'}`;

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '../../'),
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Revenue dashboards → m07-api:4013 (must come before the broad /api/manager/:path* rule)
        {
          source: '/api/manager/revenue-dashboards/:path*',
          destination: `${m07ApiUrl}/api/manager/revenue-dashboards/:path*`,
        },
      ],
      afterFiles: [
        { source: '/api/v1/:path*',           destination: `${backendUrl}/api/v1/:path*` },
        { source: '/api/forecast/:path*',     destination: `${backendUrl}/api/forecast/:path*` },
        { source: '/api/deals/:path*',        destination: `${backendUrl}/api/deals/:path*` },
        { source: '/api/deal-boards/:path*',  destination: `${backendUrl}/api/deal-boards/:path*` },
        { source: '/api/notifications/:path*', destination: `${backendUrl}/api/notifications/:path*` },
        { source: '/api/closed-deals/:path*', destination: `${backendUrl}/api/closed-deals/:path*` },
        { source: '/api/pipeline/:path*',     destination: `${backendUrl}/api/pipeline/:path*` },
        { source: '/api/ai-predictor/:path*', destination: `${backendUrl}/api/ai-predictor/:path*` },
        { source: '/api/targets/:path*',      destination: `${backendUrl}/api/targets/:path*` },
        { source: '/api/targets',             destination: `${backendUrl}/api/targets` },
        { source: '/api/team/:path*',         destination: `${backendUrl}/api/team/:path*` },
        { source: '/api/search/:path*',       destination: `${backendUrl}/api/search/:path*` },
        { source: '/api/contacts/:path*',     destination: `${backendUrl}/api/contacts/:path*` },
        { source: '/api/email-templates',     destination: `${backendUrl}/api/email-templates` },
        { source: '/api/trainings',           destination: `${backendUrl}/api/trainings` },
        { source: '/api/trainings/:path*',    destination: `${backendUrl}/api/trainings/:path*` },
        { source: '/api/manager/:path*',      destination: `${backendUrl}/api/manager/:path*` },

      ],
      fallback: [],
    };
  },
};

export default nextConfig;
