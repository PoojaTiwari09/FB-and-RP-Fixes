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
      { source: '/api/v1/hubspot/:path*', destination: `${backendUrl}/api/v1/hubspot/:path*` },
      { source: '/api/forecast/:path*', destination: `${backendUrl}/api/forecast/:path*` },
      { source: '/api/deals/:path*', destination: `${backendUrl}/api/deals/:path*` },
      { source: '/api/deal-boards/:path*', destination: `${backendUrl}/api/deal-boards/:path*` },
      { source: '/api/notifications/:path*', destination: `${backendUrl}/api/notifications/:path*` },
      { source: '/api/closed-deals/:path*', destination: `${backendUrl}/api/closed-deals/:path*` },
      { source: '/api/pipeline/:path*', destination: `${backendUrl}/api/pipeline/:path*` },
      { source: '/api/ai-predictor/:path*', destination: `${backendUrl}/api/ai-predictor/:path*` },
      { source: '/api/targets/:path*', destination: `${backendUrl}/api/targets/:path*` },
      { source: '/api/targets', destination: `${backendUrl}/api/targets` },
      { source: '/api/calls/:path*', destination: `${backendUrl}/api/calls/:path*` },
      { source: '/api/coaching/:path*', destination: `${backendUrl}/api/coaching/:path*` },
      { source: '/api/tasks/:path*', destination: `${backendUrl}/api/tasks/:path*` },
      { source: '/api/tasks', destination: `${backendUrl}/api/tasks` },
      { source: '/api/engage/:path*', destination: `${backendUrl}/api/engage/:path*` },
      { source: '/api/activities/:path*', destination: `${backendUrl}/api/activities/:path*` },
      { source: '/api/team/:path*', destination: `${backendUrl}/api/team/:path*` },
      { source: '/api/search/:path*', destination: `${backendUrl}/api/search/:path*` },
      { source: '/api/contacts/:path*', destination: `${backendUrl}/api/contacts/:path*` },
      { source: '/api/email-templates', destination: `${backendUrl}/api/email-templates` },
      { source: '/api/call-reviews/:path*', destination: `${backendUrl}/api/call-reviews/:path*` },
      { source: '/api/call-reviews', destination: `${backendUrl}/api/call-reviews` },
      { source: '/api/trainings/:path*', destination: `${backendUrl}/api/trainings/:path*` },
      { source: '/api/manager/:path*', destination: `${backendUrl}/api/manager/:path*` },
      { source: '/api/manager/calls', destination: `${backendUrl}/api/manager/calls` },
      { source: '/api/analytics/:path*', destination: `${backendUrl}/api/analytics/:path*` },
      { source: '/api/scorecards/:path*', destination: `${backendUrl}/api/scorecards/:path*` },
      { source: '/api/users/:path*', destination: `${backendUrl}/api/users/:path*` },
      { source: '/api/meta/:path*', destination: `${backendUrl}/api/meta/:path*` },
      { source: '/api/filters/:path*', destination: `${backendUrl}/api/filters/:path*` },
      { source: '/api/streams/:path*', destination: `${backendUrl}/api/streams/:path*` },
      { source: '/api/smart-call/:path*', destination: `${backendUrl}/api/smart-call/:path*` },
      { source: '/api/trackers/:path*', destination: `${backendUrl}/api/trackers/:path*` },
      { source: '/api/trackers', destination: `${backendUrl}/api/trackers` },
      // AI Deep Researcher endpoints
      { source: '/api/ai-deep-researcher/:path*', destination: `${backendUrl}/api/ai-deep-researcher/:path*` },
      { source: '/api/reps/:path*', destination: `${backendUrl}/api/reps/:path*` },
      { source: '/api/reps', destination: `${backendUrl}/api/reps` },
      { source: '/api/objections/:path*', destination: `${backendUrl}/api/objections/:path*` },
      { source: '/api/accounts/:path*', destination: `${backendUrl}/api/accounts/:path*` },
      { source: '/api/recommendations/:path*', destination: `${backendUrl}/api/recommendations/:path*` },
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
