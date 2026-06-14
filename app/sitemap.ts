import type { MetadataRoute } from 'next'
import { posadas, destinos } from '@/lib/data'
import { SITE_URL } from '@/lib/constants'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ['', '/buscar', '/posaderos', '/vision', '/faq', '/registro-posada'].map(p => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: 'weekly' as const,
    priority: p === '' ? 1 : 0.7,
  }))

  const destinoRoutes = destinos.map(d => ({
    url: `${SITE_URL}/destinos/${d.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  const posadaRoutes = posadas.map(p => ({
    url: `${SITE_URL}/posadas/${p.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...destinoRoutes, ...posadaRoutes]
}
