/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Output standalone build for Docker
  output: "standalone",
  transpilePackages: [
    "@seaversity/ui",
    "@seaversity/utils",
    "@seaversity/types",
  ],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
  // Allow images from MinIO storage
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/seaversity-uploads/**",
      },
      {
        protocol: "https",
        hostname: "localhost",
        port: "9000",
        pathname: "/seaversity-uploads/**",
      },
      // For production MinIO or S3
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
