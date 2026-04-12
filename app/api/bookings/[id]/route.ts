import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { bookings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const db = getDb()
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, parseInt(id)))
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(booking)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { status, hostNotes } = await req.json()
  const db = getDb()
  const [updated] = await db.update(bookings)
    .set({ status, hostNotes, updatedAt: new Date() })
    .where(eq(bookings.id, parseInt(id)))
    .returning()
  return NextResponse.json(updated)
}
