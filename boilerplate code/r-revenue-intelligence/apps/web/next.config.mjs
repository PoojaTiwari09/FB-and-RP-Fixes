/** @type {import('next').NextConfig} */
const m01 = process.env.NEXT_PUBLIC_M01_API_URL || 'http://localhost:3001';
const m02 = process.env.NEXT_PUBLIC_M02_API_URL || 'http://localhost:3002';

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_M01_API_URL: m01,
    NEXT_PUBLIC_M02_API_URL: m02,
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/capture-transcription/:path*',
        destination: `${m01}/api/v1/capture-transcription/:path*`,
      },
      {
        source: '/api/v1/conversation-intelligence/:path*',
        destination: `${m02}/api/v1/conversation-intelligence/:path*`,
      },
      {
        source: '/api/v1/m02-conversation-intelligence/:path*',
        destination: `${m02}/api/v1/m02-conversation-intelligence/:path*`,
      },
      { source: '/uploads/:path*', destination: `${m01}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
