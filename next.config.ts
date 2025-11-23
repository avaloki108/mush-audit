import { WEBSITE_URL } from "./src/utils/constants";

/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  reactStrictMode: true,
  images: {
    domains: [WEBSITE_URL],
    unoptimized: true,
  },
  async headers() {
    return [
      {
        // match all routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/etherscan/:path*",
        destination: "https://api.etherscan.io/v2/api/:path*",
      },
      {
        source: "/etherscan/:path*",
        destination: "https://etherscan.io/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
