import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://birga-quramiz.uz';

  // 1. Fetch dynamic products
  let products: { slug: string }[] = [];
  try {
    const res = await fetch('https://api.birga-quramiz.uz/products', { next: { revalidate: 3600 } });
    if (res.ok) {
      products = await res.json();
    }
  } catch (error) {
    console.error('Failed to fetch products for sitemap:', error);
  }

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${base}/product/${product.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  // 2. Fetch dynamic brands
  let brands: { slug: string }[] = [];
  try {
    const res = await fetch('https://api.birga-quramiz.uz/brands', { next: { revalidate: 3600 } });
    if (res.ok) {
      brands = await res.json();
    }
  } catch (error) {
    console.error('Failed to fetch brands for sitemap:', error);
  }

  const brandPages: MetadataRoute.Sitemap = brands.map((brand) => ({
    url: `${base}/brands/${brand.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // 3. Define static pages
  const staticRoutes = [
    '/catalog',
    '/seller',
    '/builders',
    '/equipment',
    '/about',
    '/help',
    '/brands',
  ];

  const staticPages: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 4. Return full final sitemap
  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...staticPages,
    ...productPages,
    ...brandPages,
  ];
}