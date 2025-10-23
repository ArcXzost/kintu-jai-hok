/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  experimental: {
    // Reduces memory usage in development
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']
  }
};

// Increase the maximum number of listeners
if (process.env.NODE_ENV === 'development') {
  process.setMaxListeners(20);
}

module.exports = nextConfig;
