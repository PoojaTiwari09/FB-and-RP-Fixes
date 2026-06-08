import type { NextConfig } from 'next';

const backendUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.BACKEND_API_URL ??
  'http://localhost:3001';

// m07-api runs on port 4013. Use 127.0.0.1 to avoid IPv6 issues.
const m07ApiUrl =
  process.env.M07_API_URL ??
  `http://127.0.0.1:${process.env.M07_API_PORT ?? '4013'}`;

const nextConfig: NextConfig = {
  serverExternalPackages: ['groq-sdk'],
  async headers() {
    return [
      {
        // Inject auth headers on all revenue-dashboards API requests
        // so m07-api JWT guard (M07_STANDALONE_AUTH mode) can resolve tenant context
        source: '/api/manager/revenue-dashboards/:path*',
        headers: [
          { key: 'x-tenant-id', value: '00000000-0000-0000-0000-000000000001' },
          { key: 'x-user-id',   value: '00000000-0000-0000-0000-000000000002' },
          { key: 'x-user-role', value: 'MANAGER' },
          { key: 'x-role',      value: 'MANAGER' },
        ],
      },
    ];
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
        { source: '/api/v1/hubspot/:path*',   destination: `${backendUrl}/api/v1/hubspot/:path*` },
        { source: '/api/calls/:path*',        destination: `${backendUrl}/api/calls/:path*` },
        { source: '/api/coaching/:path*',     destination: `${backendUrl}/api/coaching/:path*` },
        { source: '/api/tasks/:path*',        destination: `${backendUrl}/api/tasks/:path*` },
        { source: '/api/tasks',               destination: `${backendUrl}/api/tasks` },
        { source: '/api/engage/:path*',       destination: `${backendUrl}/api/engage/:path*` },
        { source: '/api/activities/:path*',   destination: `${backendUrl}/api/activities/:path*` },
        { source: '/api/team/:path*',         destination: `${backendUrl}/api/team/:path*` },
        { source: '/api/search/:path*',       destination: `${backendUrl}/api/search/:path*` },
        { source: '/api/contacts/:path*',     destination: `${backendUrl}/api/contacts/:path*` },
        { source: '/api/email-templates',     destination: `${backendUrl}/api/email-templates` },
        { source: '/api/call-reviews/:path*', destination: `${backendUrl}/api/call-reviews/:path*` },
        { source: '/api/call-reviews',        destination: `${backendUrl}/api/call-reviews` },
        { source: '/api/trainings/:path*',    destination: `${backendUrl}/api/trainings/:path*` },
        { source: '/api/manager/:path*',      destination: `${backendUrl}/api/manager/:path*` },
        { source: '/api/manager/calls',       destination: `${backendUrl}/api/manager/calls` },
        { source: '/api/analytics/:path*',    destination: `${backendUrl}/api/analytics/:path*` },
        { source: '/api/scorecards/:path*',   destination: `${backendUrl}/api/scorecards/:path*` },
        { source: '/api/users/:path*',        destination: `${backendUrl}/api/users/:path*` },
        { source: '/api/meta/:path*',         destination: `${backendUrl}/api/meta/:path*` },
        { source: '/api/filters/:path*',      destination: `${backendUrl}/api/filters/:path*` },
        { source: '/api/streams/:path*',      destination: `${backendUrl}/api/streams/:path*` },
        { source: '/api/smart-call/:path*',   destination: `${backendUrl}/api/smart-call/:path*` },
        { source: '/api/trackers/:path*',     destination: `${backendUrl}/api/trackers/:path*` },
        { source: '/api/trackers',            destination: `${backendUrl}/api/trackers` },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
