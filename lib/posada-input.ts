// Validación y lista blanca de campos de una posada (alta y edición por el posadero).
// Nunca incluye status, hostId, rating, reviews ni slug.

const arr = (v: unknown) => Array.isArray(v) ? v.map(String).slice(0, 60) : []

// Teléfonos, correos, enlaces o redes: la comunicación con huéspedes va por el chat de la app.
// Un teléfono = una secuencia con 10+ dígitos (ignora fechas, montos o RIF, que tienen menos).
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[a-z]{2,}/i
const URL_RE = /(https?:\/\/|www\.|wa\.me|\b[\w-]+\.(com|net|org|ve|info|co|me|link)\b)/i
const SOCIAL_RE = /\b(whats ?app|wasap|telegram|instagram|facebook|tiktok|arroba)\b|(^|\s)@[a-z0-9_.]{3,}/i
export function hasContactInfo(text: string): boolean {
  if (EMAIL_RE.test(text) || URL_RE.test(text) || SOCIAL_RE.test(text)) return true
  for (const m of text.match(/[+\d][\d\s().-]{7,}\d/g) ?? []) {
    if (m.replace(/\D/g, '').length >= 10) return true
  }
  return false
}

type Result = { ok: true; data: Record<string, unknown> } | { ok: false; error: string }

// partial = edición: solo valida los campos presentes.
export function parsePosadaInput(body: any, partial = false): Result {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Datos inválidos' }
  const d: Record<string, unknown> = {}
  const has = (k: string) => body[k] !== undefined

  if (!partial || has('nombre')) {
    const v = String(body.nombre ?? '').trim()
    if (!v) return { ok: false, error: 'El nombre es obligatorio' }
    d.nombre = v.slice(0, 120)
  }
  if (!partial || has('descripcion')) {
    const v = String(body.descripcion ?? '').trim()
    if (!v) return { ok: false, error: 'La descripción es obligatoria' }
    d.descripcion = v.slice(0, 5000)
  }
  if (!partial || has('destino') || has('destinoSlug')) {
    if (!body.destino || !body.destinoSlug) return { ok: false, error: 'Elige un destino' }
    d.destino = String(body.destino).slice(0, 80)
    d.destinoSlug = String(body.destinoSlug).slice(0, 80)
  }
  if (!partial || has('precio')) {
    const v = Number(body.precio)
    if (!Number.isInteger(v) || v < 1 || v > 10000) return { ok: false, error: 'El precio por noche debe ser un número entre 1 y 10.000 USD' }
    d.precio = v
  }
  if (!partial || has('lat') || has('lng')) {
    const lat = body.lat === null || body.lat === '' ? NaN : Number(body.lat)
    const lng = body.lng === null || body.lng === '' ? NaN : Number(body.lng)
    if (!(lat >= -90 && lat <= 90) || !(lng >= -180 && lng <= 180)) return { ok: false, error: 'Revisa la latitud y longitud de tu posada (ej. 10.49 y -67.61)' }
    d.lat = lat; d.lng = lng
  }
  for (const k of ['habitaciones', 'capacidad'] as const) {
    if (!partial || has(k)) {
      const v = Number(body[k] ?? (k === 'capacidad' ? 2 : 1))
      if (!Number.isInteger(v) || v < 1 || v > 500) return { ok: false, error: k === 'capacidad' ? 'La capacidad debe estar entre 1 y 500 personas' : 'Las habitaciones deben estar entre 1 y 500' }
      d[k] = v
    }
  }
  if (!partial || has('tipo')) d.tipo = String(body.tipo || 'Posada').slice(0, 60)
  for (const k of ['tags', 'servicios', 'politicas', 'imgs', 'metodoPago'] as const) {
    if (!partial || has(k)) d[k] = arr(body[k])
  }
  const texts = [d.nombre, d.descripcion, ...((d.politicas as string[]) ?? [])].filter(Boolean).map(String)
  if (texts.some(hasContactInfo)) {
    return { ok: false, error: 'No incluyas teléfonos, correos, enlaces ni redes sociales en la posada: toda la comunicación con huéspedes va por el chat de RESER-VE.' }
  }
  if (Array.isArray(d.imgs) && (d.imgs as string[]).some(u => !/^(https:\/\/|\/images\/)/.test(u))) {
    return { ok: false, error: 'Las fotos deben subirse desde el formulario' }
  }
  return { ok: true, data: d }
}
