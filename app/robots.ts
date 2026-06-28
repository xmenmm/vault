import type { MetadataRoute } from 'next';

// Let crawlers index the public marketing pages, but keep the authenticated
// app and the API out of search results.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/app'] },
    sitemap: 'https://vault-xi-beryl.vercel.app/sitemap.xml',
  };
}
