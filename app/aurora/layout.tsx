import type { Metadata } from 'next'
import { getT } from '@/lib/i18n-server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return {
  title: t('Sueña tu viaje con Aurora'),
  description: t('Aurora, la guacamaya viajera de RESER-VE, te arma la ruta por Venezuela con posadas reales, fechas y precios.'),
}
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
