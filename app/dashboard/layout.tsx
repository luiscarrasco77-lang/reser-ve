import { auth } from '@/auth'
import { redirect } from 'next/navigation'

// Todo /dashboard es solo para posaderos y admins.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login?callbackUrl=/dashboard')
  const role = (session.user as any).role
  if (role !== 'host' && role !== 'admin') redirect('/mis-reservas')
  return <>{children}</>
}
