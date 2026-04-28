/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['res.cloudinary.com', 'xdminds.s3.ap-south-1.amazonaws.com'],
    unoptimized: true,
  },
};

module.exports = nextConfig;
