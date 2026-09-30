import { auth } from '@/auth'
import { redirect } from 'next/navigation'

// Los mensajes requieren sesión.
export default async function MensajesLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login?callbackUrl=/mensajes')
  return <>{children}</>
}
