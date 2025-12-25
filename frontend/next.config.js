/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // API rewrites to avoid CORS issues during development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },

  // Image optimization configuration
  images: {
    domains: ['i.ytimg.com', 'yt3.ggpht.com'],
  },

  // Enable experimental features for React 19
  experimental: {
    reactCompiler: false,
  },
};

module.exports = nextConfig;
