import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { getDb } from '@/lib/db'
import { posadas } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import EditarPosadaForm from './EditarPosadaForm'

export default async function EditarPosadaPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { slug } = await params
  const db = getDb()
  const [posada] = await db.select().from(posadas).where(eq(posadas.slug, slug))
  if (!posada) notFound()

  const userId = parseInt((session.user as any).id)
  if (posada.hostId !== userId) redirect('/dashboard/posadas')

  // Only allow editing if draft or rejected
  if (posada.status !== 'draft' && posada.status !== 'rejected') {
    redirect('/dashboard/posadas')
  }

  return <EditarPosadaForm posada={posada} />
}
