import type { Metadata } from 'next'
import { getT } from '@/lib/i18n-server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return {
  title: t('Crear cuenta'),
  description: t('Crea tu cuenta gratis en RESER-VE como viajero o posadero.'),
  robots: { index: false },
}
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
