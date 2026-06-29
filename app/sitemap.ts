import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://vault-xi-beryl.vercel.app';
  return [
    { url: `${base}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/security`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/login`, changeFrequency: 'yearly', priority: 0.5 },
  ];
}
