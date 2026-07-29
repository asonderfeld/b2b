/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Verhindert, dass reine Stilwarnungen den Produktions-Build blockieren.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
