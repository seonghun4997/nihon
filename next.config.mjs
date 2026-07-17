import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['kuromoji'],
    outputFileTracingIncludes: { '/**': ['./node_modules/kuromoji/**'] },
    instrumentationHook: true,
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
    },
  ],
};

export default withSentryConfig(nextConfig, {
  org: "51cc0ae70f53",
  project: "nihon",
  silent: !process.env.CI,
  telemetry: false,
});
