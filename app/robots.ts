import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin', '/dashboard', '/mensajes', '/mis-reservas', '/favoritos', '/reservar', '/reserva', '/restablecer', '/cuenta'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
