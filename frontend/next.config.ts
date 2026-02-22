import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*/',
        destination: 'http://165.22.62.3:8000/api/:path*/',
      },
      {
        source: '/api/:path*',
        destination: 'http://165.22.62.3:8000/api/:path*/',
      },
    ];
  },
};

export default nextConfig;
