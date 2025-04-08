/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Use standalone output for containerized deployment
  output: 'standalone',
  
  // Enable image optimization
  images: {
    // Configure domains for external images if any
    domains: [],
  },
  
  // Configure environment variables
  env: {
    // Backend API URL (will be overridden by environment variables)
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  
  // Use extended ESLint configuration
  eslint: {
    dirs: ['app', 'src', 'pages', 'components'],
  },
  
  // Add any other necessary configuration
  experimental: {
    // Any experimental features you want to enable
  },
}

module.exports = nextConfig
