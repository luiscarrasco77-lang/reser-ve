import type { Metadata } from 'next'
import { getT } from '@/lib/i18n-server'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('Mi cuenta'), robots: { index: false } }
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login?callbackUrl=/cuenta')
  return children
}
