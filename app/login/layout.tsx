import type { Metadata } from 'next'
import { getT } from '@/lib/i18n-server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return {
  title: t('Iniciar sesión'),
  description: t('Entra a tu cuenta de RESER-VE.'),
  robots: { index: false },
}
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
