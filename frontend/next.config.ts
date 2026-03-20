import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/dist/widget/:path*',
        destination: 'https://assets.gameball.co/widget/:path*',
      },
    ];
  },
};

export default nextConfig;
