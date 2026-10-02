import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aurora · Planifica tu viaje con IA',
  description: 'Cuéntale a Aurora qué viaje sueñas por Venezuela y te arma un plan con posadas reales y precios.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
