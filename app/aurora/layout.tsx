import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sueña tu viaje con Aurora',
  description: 'Aurora, la guacamaya viajera de RESER-VE, te arma la ruta por Venezuela con posadas reales, fechas y precios.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
