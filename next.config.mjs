/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dynamically load allowedDevOrigins from .env
  allowedDevOrigins: process.env.NEXT_ALLOWED_DEV_ORIGINS
    ? process.env.NEXT_ALLOWED_DEV_ORIGINS.split(',')
    : [''], // Fallback
};
export default nextConfig;

