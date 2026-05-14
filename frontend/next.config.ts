import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // standalone output is used by the Docker multi-stage build (TASK-DEPLOY-002).
  // On Windows without Developer Mode, symlink creation fails during `next build`.
  // Set NEXT_STANDALONE=true in the Dockerfile to enable this.
  output: process.env.NEXT_STANDALONE === 'true' ? 'standalone' : undefined,
};

export default nextConfig;
