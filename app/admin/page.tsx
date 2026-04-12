import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import AdminDashboard from './AdminDashboard'

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    redirect('/login?callbackUrl=/admin')
  }
  return <AdminDashboard adminName={session.user.name ?? 'Admin'} adminEmail={session.user.email ?? ''} />
}
