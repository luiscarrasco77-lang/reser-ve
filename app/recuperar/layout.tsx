import type { Metadata } from 'next'
import { getT } from '@/lib/i18n-server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return {
  title: t('Recuperar contraseña'),
  description: t('Recupera el acceso a tu cuenta de RESER-VE.'),
  robots: { index: false },
}
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
