'use client'

// Reduce la foto en el navegador (máx. 1800 px, JPEG ~82%) antes de subirla:
// las fotos de móvil pesan 5–10 MB y el servidor acepta ~4 MB por petición.
async function shrink(file: File): Promise<Blob> {
  const MAX = 1800
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('No pudimos leer esta imagen. Si es HEIC (iPhone), expórtala como JPG e inténtalo de nuevo.')
  }
  const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height))
  if (scale === 1 && file.size < 2.5 * 1024 * 1024 && /jpe?g|webp/.test(file.type)) { bitmap.close(); return file }
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.82))
  if (!blob) throw new Error('No pudimos procesar la imagen.')
  return blob
}

// Sube una foto de posada. Devuelve la URL pública o lanza un Error con mensaje en español.
export async function uploadPosadaImage(file: File): Promise<string> {
  const blob = await shrink(file)
  const fd = new FormData()
  const name = file.name.replace(/\.[^.]+$/, '') + (blob === file ? file.name.match(/\.[^.]+$/)?.[0] ?? '.jpg' : '.jpg')
  fd.append('file', blob, name)
  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  if (res.status === 413) throw new Error('La foto es demasiado pesada. Prueba con otra o redúcela.')
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.url) throw new Error(data.error ?? 'No se pudo subir la foto.')
  return data.url
}
