/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@interview-iq/shared'],
  eslint: {
    // Lint is a separate CI step; do not fail production builds on lint.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
