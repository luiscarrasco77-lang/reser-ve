import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'
import { queryPosadas } from '@/lib/posadas-query'

// Se regenera cada hora con las posadas activas de la BD.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ['', '/buscar', '/aurora', '/posaderos', '/vision', '/faq', '/terminos', '/privacidad'].map(p => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: 'weekly' as const,
    priority: p === '' ? 1 : 0.7,
  }))

  const posadas = await queryPosadas()
  const destinoRoutes = [...new Set(posadas.map(p => p.destinoSlug))].map(slug => ({
    url: `${SITE_URL}/destinos/${slug}`,
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
