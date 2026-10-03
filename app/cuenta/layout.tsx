import type { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Mi cuenta', robots: { index: false } }

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login?callbackUrl=/cuenta')
  return children
}
