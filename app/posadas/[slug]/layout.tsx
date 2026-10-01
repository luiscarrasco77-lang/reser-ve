import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { posadas } from '@/lib/db/schema'
import { getPosada } from '@/lib/data'

// La ficha es un componente de cliente; este layout de servidor aporta título/descripción
// para SEO y devuelve 404 real si la posada no existe.
async function find(slug: string) {
  if (!process.env.DATABASE_URL) {
    const p = getPosada(slug)
    return p ? { nombre: p.nombre, destino: p.destino, descripcion: p.descripcion, img: p.imgs[0], status: 'active' } : null
  }
  const [p] = await getDb().select({ nombre: posadas.nombre, destino: posadas.destino, descripcion: posadas.descripcion, imgs: posadas.imgs, status: posadas.status })
    .from(posadas).where(eq(posadas.slug, slug))
  return p ? { ...p, img: ((p.imgs as string[]) ?? [])[0] } : null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await find((await params).slug)
  if (!p || p.status !== 'active') return { title: 'Posada' }
  const description = p.descripcion.slice(0, 160)
  return {
    title: `${p.nombre} · ${p.destino}`,
    description,
    openGraph: { title: `${p.nombre} · ${p.destino}`, description, ...(p.img ? { images: [p.img] } : {}) },
  }
}

export default async function PosadaLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  // Solo 404 si no existe en absoluto (las no activas las puede previsualizar su dueño o un admin).
  if (!(await find((await params).slug))) notFound()
  return <>{children}</>
}
