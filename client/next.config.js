/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Lint is run separately via `npm run lint`; existing style/a11y findings should not block builds.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
