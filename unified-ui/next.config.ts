import type { NextConfig } from 'next';

const backendUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.BACKEND_API_URL ??
  'http://localhost:3001';

const nextConfig: NextConfig = {
  serverExternalPackages: ['groq-sdk'],
  async rewrites() {
    return [
      { source: '/api/v1/hubspot/:path*', destination: `${backendUrl}/api/v1/hubspot/:path*` },
      { source: '/api/forecast/:path*', destination: `${backendUrl}/api/forecast/:path*` },
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
    ];
  },
};

export default nextConfig;
