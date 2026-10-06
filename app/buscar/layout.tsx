import type { Metadata } from 'next'
import { getT } from '@/lib/i18n-server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return {
  title: t('Buscar posadas en Venezuela'),
  description: t('Busca posadas por destino, precio y método de pago, con mapa: Los Roques, Mérida, Mochima, Morrocoy, Canaima, Margarita y más.'),
}
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
