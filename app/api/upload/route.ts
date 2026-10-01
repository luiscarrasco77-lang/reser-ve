import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { auth } from '@/auth'
import { rateLimit } from '@/lib/http'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as any).role
  if (role !== 'host' && role !== 'admin') return NextResponse.json({ error: 'Solo los posaderos pueden subir fotos' }, { status: 403 })
  const limited = rateLimit(req, 'upload', 80, 60 * 60_000)
  if (limited) return limited

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Almacenamiento de imágenes no configurado. Falta BLOB_READ_WRITE_TOKEN.' },
      { status: 503 }
    )
  }

  const formData = await req.formData().catch(() => null)
  const file = formData?.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Falta la imagen' }, { status: 400 })

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Solo se permiten imágenes JPG, PNG, WebP o GIF' }, { status: 400 })
  }

  const maxSize = 10 * 1024 * 1024 // 10 MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'La imagen no puede superar 10 MB' }, { status: 400 })
  }

  // Comprueba la firma real del archivo (no solo el tipo declarado).
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const isJpg = head[0] === 0xff && head[1] === 0xd8
  const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47
  const isGif = head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46
  const isWebp = head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 && head[8] === 0x57 && head[9] === 0x45
  if (!(isJpg || isPng || isGif || isWebp)) return NextResponse.json({ error: 'El archivo no es una imagen válida' }, { status: 400 })

  const safeName = file.name.toLowerCase().normalize('NFD').replace(/[^a-z0-9.]+/g, '-').replace(/-+/g, '-').slice(-60) || 'foto.jpg'
  try {
    const blob = await put(`posadas/${Date.now()}-${safeName}`, file, {
      access: 'public',
      contentType: file.type,
    })
    return NextResponse.json({ url: blob.url })
  } catch (e: any) {
    console.error('[upload]', e)
    return NextResponse.json({ error: 'No se pudo subir la imagen. Inténtalo de nuevo.' }, { status: 500 })
  }
}
