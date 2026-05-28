import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(dir, '../../../../../');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: {
    outputFileTracingRoot: monorepoRoot,
    serverComponentsExternalPackages: ['@rri/database', '@prisma/client'],
  },
};

export default nextConfig;
