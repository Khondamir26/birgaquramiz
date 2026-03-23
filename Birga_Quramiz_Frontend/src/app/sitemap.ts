import type { MetadataRoute } from 'next';

const BASE = 'https://birga-quramiz.uz';
const API  = process.env.API_INTERNAL_URL || 'https://api.birga-quramiz.uz';

async function fetchAllPages<T>(path: string, pageSize = 200): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${API}${path}?page=${page}&limit=${pageSize}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) break;
    const json = await res.json();
    const items: T[] = Array.isArray(json) ? json : (json.data ?? []);
    results.push(...items);
    const total: number = json.meta?.total ?? json.total ?? items.length;
    if (results.length >= total || items.length < pageSize) break;
    page++;
  }
  return results;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, brands] = await Promise.all([
    fetchAllPages<{ slug: string; updatedAt?: string }>('/products').catch(() => []),
    fetchAllPages<{ slug: string; updatedAt?: string }>('/brands').catch(() => []),
  ]);

  const staticRoutes = ['/', '/catalog', '/seller', '/builders', '/equipment', '/about', '/help', '/brands'];

  return [
    ...staticRoutes.map((route) => ({
      url: `${BASE}${route}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: route === '/' ? 1.0 : 0.8,
    })),
    ...products.filter((p) => p.slug).map((p) => ({
      url: `${BASE}/product/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    })),
    ...brands.filter((b) => b.slug).map((b) => ({
      url: `${BASE}/brands/${b.slug}`,
      lastModified: b.updatedAt ? new Date(b.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
