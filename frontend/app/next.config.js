/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure output export for static hosting
  output: 'export',
  // Set the base path if your app isn't hosted at the root
  // basePath: '',
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  // Add any other necessary configuration
  // Disable certain features incompatible with static export if needed
  experimental: {
    // Any experimental features you want to enable
  },
}

module.exports = nextConfig
