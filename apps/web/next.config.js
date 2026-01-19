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
};

module.exports = nextConfig;
