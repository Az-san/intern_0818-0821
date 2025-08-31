/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    // Dev: proxy /planner/* to Vite dev server
    if (process.env.NODE_ENV !== 'production') {
      return [
        {
          source: '/planner/:path*',
          destination: 'http://localhost:5173/:path*',
        },
      ]
    }
    return []
  },
}

export default nextConfig
