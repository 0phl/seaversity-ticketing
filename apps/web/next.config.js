/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@seaversity/ui",
    "@seaversity/utils",
    "@seaversity/types",
  ],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
};

module.exports = nextConfig;
