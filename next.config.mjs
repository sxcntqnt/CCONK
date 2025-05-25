/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dynamically load allowedDevOrigins from .env
  allowedDevOrigins: process.env.NEXT_ALLOWED_DEV_ORIGINS
    ? process.env.NEXT_ALLOWED_DEV_ORIGINS.split(',')
    : [''], // Fallback
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '', // Leave empty for default port
        pathname: '/**', // Allow all paths under img.clerk.com
      },
    ],
  },
};

export default nextConfig;
