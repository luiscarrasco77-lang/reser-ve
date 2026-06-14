import { NextRequest, NextResponse } from 'next/server'
import { emailPosadaLead } from '@/lib/email'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Captura una solicitud pública de registro de posada (lead) y notifica al equipo.
// No requiere cuenta: el equipo verifica y luego ayuda al posadero a publicar.
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { nombrePosada, destino, tipo, descripcion, nombrePosadero, emailPosadero } = body

  if (!nombrePosada || !destino || !nombrePosadero || !EMAIL_RE.test(emailPosadero ?? '')) {
    return NextResponse.json({ error: 'Faltan campos requeridos o el email es inválido' }, { status: 400 })
  }

  // Notifica al equipo (fire-and-forget: el lead se considera recibido aunque el email falle).
  emailPosadaLead({
    nombrePosada,
    destino,
    tipo: tipo ?? '—',
    descripcion: descripcion ?? '',
    habitaciones: String(body.habitaciones ?? '—'),
    capacidad: String(body.capacidad ?? '—'),
    precio: String(body.precio ?? '—'),
    servicios: Array.isArray(body.servicios) ? body.servicios : [],
    nombrePosadero,
    emailPosadero,
    telefono: body.telefono,
    whatsapp: body.whatsapp,
    metodoCobro: Array.isArray(body.metodoCobro) ? body.metodoCobro : [],
  }).catch(() => {})

  return NextResponse.json({ ok: true }, { status: 201 })
}
