/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development';

// Content-Security-Policy. The AES key lives in localStorage, so the most
// valuable line here is `connect-src 'self'` — even if an XSS bug ran, it
// couldn't POST the key to an external server. Dev needs 'unsafe-eval' + ws:
// for HMR; production is tighter ('wasm-unsafe-eval' only, for the Spline 3D).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : "'wasm-unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://www.google.com https://*.gstatic.com https://cdn.simpleicons.org",
  "font-src 'self'",
  // unpkg.com: the Spline 3D runtime fetches its WASM module from there.
  // It's a read-only file CDN, so it can't be used to exfiltrate the key.
  `connect-src 'self' https://unpkg.com${isDev ? ' ws: wss:' : ''}`,
  "worker-src 'self' blob:",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
];
if (!isDev) {
  securityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains',
  });
}

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
