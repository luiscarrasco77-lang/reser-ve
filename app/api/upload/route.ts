import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { auth } from '@/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Almacenamiento de imágenes no configurado. Falta BLOB_READ_WRITE_TOKEN.' },
      { status: 503 }
    )
  }

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Solo se permiten imágenes JPG, PNG, WebP o GIF' }, { status: 400 })
  }

  const maxSize = 10 * 1024 * 1024 // 10 MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'La imagen no puede superar 10 MB' }, { status: 400 })
  }

  try {
    const blob = await put(`posadas/${Date.now()}-${file.name}`, file, {
      access: 'public',
      contentType: file.type,
    })
    return NextResponse.json({ url: blob.url })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error al subir imagen' }, { status: 500 })
  }
}
