import { MetadataRoute } from 'next';
import { BASE_URL } from '@/config/seo-config';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${BASE_URL}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
  ];

  return routes;
}
