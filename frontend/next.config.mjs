// The browser always calls the relative `/api/...`; Next proxies it to the backend,
// so no CORS setup is needed. Rewrites are resolved at build time, so in Docker
// BACKEND_URL is passed as a build arg (see Dockerfile).
const backend = process.env.BACKEND_URL || 'http://localhost:3000';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${backend}/api/:path*` }];
  },
};

export default nextConfig;
