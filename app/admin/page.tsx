import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getDb } from '@/lib/db'
import { posadas, users } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
import AdminReviewQueue from './ReviewQueue'

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    redirect('/login?callbackUrl=/admin')
  }

  const db = getDb()

  // All posadas needing review
  const pending = await db.select().from(posadas)
    .where(eq(posadas.status, 'pending_review'))

  // Recently reviewed (last 20)
  const reviewed = await db.select().from(posadas)
    .where(inArray(posadas.status, ['active', 'rejected']))

  // Get host names
  const hostIds = [...new Set([...pending, ...reviewed].map(p => p.hostId).filter(Boolean))] as number[]
  const hosts = hostIds.length > 0
    ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, hostIds))
    : []

  const hostMap = Object.fromEntries(hosts.map(h => [h.id, h]))

  return (
    <AdminReviewQueue
      pending={pending}
      reviewed={reviewed.slice(0, 20)}
      hostMap={hostMap}
      adminName={session.user.name ?? 'Admin'}
    />
  )
}
