import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import * as schema from '../lib/db/schema'
import { posadas as posadasData } from '../lib/data'
// env loaded externally via dotenv-cli

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

// Demo password for every seeded account (change before any real launch)
const DEMO_PASSWORD = 'reserve2026'

async function upsertUser(name: string, email: string, role: 'traveler' | 'host' | 'admin') {
  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, email))
  if (existing) return existing
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)
  const [user] = await db.insert(schema.users).values({ name, email, passwordHash, role }).returning()
  return user
}

function emailFor(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z\s]/g, '').trim().replace(/\s+/g, '.') + '@reserve.demo'
}

async function main() {
  console.log('→ Seeding usuarios...')
  // Platform admin + a default traveler
  await upsertUser('Equipo RESER-VE', 'admin@reserve.ve', 'admin')
  const traveler = await upsertUser('Viajero Demo', 'viajero@reserve.demo', 'traveler')

  // One host user per unique host name in the dataset
  const hostByName = new Map<string, number>()
  for (const p of posadasData) {
    if (!hostByName.has(p.host.nombre)) {
      const host = await upsertUser(p.host.nombre, emailFor(p.host.nombre), 'host')
      hostByName.set(p.host.nombre, host.id)
    }
  }

  console.log('→ Seeding posadas...')
  for (const p of posadasData) {
    const hostId = hostByName.get(p.host.nombre)!
    const [inserted] = await db.insert(schema.posadas).values({
      slug: p.slug,
      hostId,
      nombre: p.nombre,
      destino: p.destino,
      destinoSlug: p.destinoSlug,
      tipo: p.tipo,
      precio: p.precio,
      habitaciones: p.habitaciones,
      capacidad: p.capacidad ?? p.habitaciones * 2,
      rating: p.rating,
      reviews: p.reviews,
      descripcion: p.descripcion,
      tags: p.tags,
      servicios: p.servicios,
      politicas: p.politicas,
      imgs: p.imgs,
      lat: p.lat,
      lng: p.lng,
      metodoPago: p.metodoPago,
      hostNombre: p.host.nombre,
      hostDesde: p.host.desde,
      hostIdiomas: p.host.idiomas,
      status: 'active',
    }).onConflictDoUpdate({
      target: schema.posadas.slug,
      // Keep demo data fresh on re-seed (imgs, precio, etc.) without touching real listings’ ownership
      set: {
        nombre: p.nombre, tipo: p.tipo, precio: p.precio, descripcion: p.descripcion,
        tags: p.tags, servicios: p.servicios, politicas: p.politicas, imgs: p.imgs,
        capacidad: p.capacidad ?? p.habitaciones * 2, updatedAt: new Date(),
      },
    }).returning()

    // Seed reviews once per posada
    const existingReviews = await db.select().from(schema.reviews).where(eq(schema.reviews.posadaId, inserted.id))
    if (existingReviews.length === 0) {
      for (const r of p.reseñas) {
        await db.insert(schema.reviews).values({
          posadaId: inserted.id,
          authorId: traveler.id,
          authorName: r.autor,
          authorCountry: r.pais,
          rating: r.rating,
          texto: r.texto,
        })
      }
    }
  }

  // Seed one example booking for the demo traveler if none exists
  console.log('→ Seeding reserva de ejemplo...')
  const existingBookings = await db.select().from(schema.bookings).where(eq(schema.bookings.guestId, traveler.id))
  if (existingBookings.length === 0) {
    const [firstPosada] = await db.select().from(schema.posadas).where(eq(schema.posadas.slug, posadasData[0].slug))
    if (firstPosada) {
      const nights = 4
      await db.insert(schema.bookings).values({
        bookingCode: 'RV-2026-1001',
        posadaId: firstPosada.id,
        guestId: traveler.id,
        checkIn: '2026-07-10',
        checkOut: '2026-07-14',
        nights,
        totalPrice: Math.round(nights * firstPosada.precio * 1.1),
        status: 'confirmed',
        paymentMethod: 'Zelle',
        guestCount: 2,
        notes: 'Llegamos sobre las 3 PM. ¡Muy emocionados!',
      })
    }
  }

  console.log('✓ Seed completo.')
  console.log(`  Admin:   admin@reserve.ve / ${DEMO_PASSWORD}`)
  console.log(`  Viajero: viajero@reserve.demo / ${DEMO_PASSWORD}`)
  console.log(`  Posaderos: <nombre>@reserve.demo / ${DEMO_PASSWORD}`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
