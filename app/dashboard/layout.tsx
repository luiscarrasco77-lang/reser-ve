import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import BecomeHost from '@/components/BecomeHost'

// /dashboard es para posaderos y admins. Un viajero ve la pantalla para activar su modo
// posadero (misma cuenta para viajar y publicar).
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login?callbackUrl=/dashboard')
  const role = (session.user as any).role
  if (role !== 'host' && role !== 'admin') return <BecomeHost name={session.user.name ?? ''} />
  return <>{children}</>
}
