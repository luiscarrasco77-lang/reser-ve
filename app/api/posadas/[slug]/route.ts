import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { posadas } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/auth'

export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = getDb()
  const [posada] = await db.select().from(posadas).where(eq(posadas.slug, slug))
  if (!posada) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(posada)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { slug } = await params
  const body = await req.json()
  const db = getDb()
  const [updated] = await db.update(posadas).set({ ...body, updatedAt: new Date() })
    .where(and(eq(posadas.slug, slug), eq(posadas.hostId, parseInt((session.user as any).id))))
    .returning()
  if (!updated) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { slug } = await params
  const db = getDb()
  await db.update(posadas).set({ status: 'suspended' })
    .where(and(eq(posadas.slug, slug), eq(posadas.hostId, parseInt((session.user as any).id))))
  return NextResponse.json({ ok: true })
}
