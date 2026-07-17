/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['kuromoji'],
    outputFileTracingIncludes: { '/**': ['./node_modules/kuromoji/**'] },
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
    },
  ],
};
export default nextConfig;
