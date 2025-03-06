/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  // Enable hot reload
  webpackDevMiddleware: (config) => {
    config.watchOptions = {
      poll: 1000, // Check for changes every second
      aggregateTimeout: 300, // Delay before rebuilding
      ignored: /node_modules/,
    };
    return config;
  },
  // Server configuration
  server: {
    port: process.env.PORT || 3456, // Use PORT from environment variables or default to 3456
  },
};

module.exports = nextConfig;
