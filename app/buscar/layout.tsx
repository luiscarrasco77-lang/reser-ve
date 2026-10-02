import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Buscar posadas en Venezuela',
  description: 'Busca posadas por destino, precio y método de pago, con mapa: Los Roques, Mérida, Mochima, Morrocoy, Canaima, Margarita y más.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
