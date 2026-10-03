import { Resend } from 'resend'
import { SITE_URL, hostNet } from './constants'

// Only initialize if API key is present — avoids build-time crash
function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

// Use RESEND_FROM env var to override, or fall back to verified domain address
const FROM = process.env.RESEND_FROM ?? 'RESER-VE <reservas@reser-ve.com>'

type Payload = Parameters<Resend['emails']['send']>[0]

// Correos a buzones de prueba (QA automático) no se envían: no gastan cuota.
const isTestRecipient = (to: unknown) =>
  (Array.isArray(to) ? to : [to]).every(t => /@resend\.dev$|@reserve\.test$/i.test(String(t)))

// Respaldo: Brevo (300 correos/día gratis). Se usa si Resend falla (p. ej. cuota agotada)
// o si no hay RESEND_API_KEY. Requiere BREVO_API_KEY y el dominio verificado en Brevo.
async function sendViaBrevo(p: Payload): Promise<boolean> {
  const key = process.env.BREVO_API_KEY
  if (!key) return false
  const m = String(p.from).match(/^(.*)<(.+)>$/)
  const toList = (Array.isArray(p.to) ? p.to : [p.to]).map(email => ({ email: String(email) }))
  const replyTo = Array.isArray(p.replyTo) ? p.replyTo[0] : p.replyTo
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': key, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: m ? { name: m[1].trim(), email: m[2].trim() } : { email: String(p.from) },
        to: toList,
        subject: p.subject,
        htmlContent: (p as any).html,
        ...(replyTo ? { replyTo: { email: String(replyTo) } } : {}),
      }),
    })
    if (!res.ok) { console.error('[email] Brevo fallo:', p.subject, res.status, await res.text()); return false }
    return true
  } catch (e) {
    console.error('[email] Brevo excepción:', p.subject, e)
    return false
  }
}

// Envía y devuelve true/false. Registra el error en los logs de Vercel en vez de tragarlo.
// Versión en texto plano del HTML (mejora la entrega en Outlook/Hotmail y Gmail).
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<(br|\/div|\/p|\/li|\/h\d)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim()
}

async function deliver(resend: Resend | null, payload: Payload): Promise<boolean> {
  if (isTestRecipient(payload.to)) { console.log('[email] prueba, no enviado:', payload.subject); return true }
  const html = (payload as any).html as string | undefined
  payload = {
    ...payload,
    ...(html && !(payload as any).text ? { text: htmlToText(html) } : {}),
    replyTo: payload.replyTo ?? 'hola@reser-ve.com',
  } as Payload
  if (resend) {
    try {
      const { error } = await resend.emails.send(payload)
      if (!error) return true
      console.error('[email] Resend fallo:', payload.subject, error)
    } catch (e) {
      console.error('[email] Resend excepción:', payload.subject, e)
    }
  }
  return sendViaBrevo(payload)
}

// Escapa texto del usuario antes de insertarlo en el HTML de un correo (evita phishing/HTML inyectado).
function esc(v: unknown): string {
  return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

// ─── Templates ────────────────────────────────────────────────────────────────

function baseHtml(content: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<style>
  body{margin:0;padding:0;background:#FDFBF7;font-family:'Inter','Helvetica Neue',Arial,sans-serif;color:#1A2B4C;}
  .wrap{max-width:560px;margin:0 auto;padding:2.5rem 1.5rem;}
  .logo{font-size:1.5rem;font-weight:800;letter-spacing:-0.04em;color:#1A2B4C;margin-bottom:2rem;}
  .logo span{color:#E67E22;}
  .card{background:white;border:1px solid rgba(26,43,76,0.08);border-radius:16px;padding:1.75rem 2rem;margin-bottom:1.25rem;}
  .title{font-size:1.4rem;font-weight:800;letter-spacing:-0.03em;margin-bottom:0.5rem;}
  .sub{font-size:0.9rem;color:#7A8699;line-height:1.65;margin-bottom:1.25rem;}
  .code-box{background:rgba(230,126,34,0.06);border:2px dashed rgba(230,126,34,0.3);border-radius:12px;padding:1.1rem 1.5rem;text-align:center;margin:1.25rem 0;}
  .code{font-size:1.6rem;font-weight:800;letter-spacing:0.1em;color:#E67E22;}
  .row{display:flex;justify-content:space-between;font-size:0.85rem;color:#7A8699;margin-bottom:0.35rem;}
  .row strong{color:#1A2B4C;}
  .divider{height:1px;background:rgba(26,43,76,0.08);margin:1rem 0;}
  .total{display:flex;justify-content:space-between;font-size:1rem;font-weight:800;color:#1A2B4C;}
  .btn{display:inline-block;padding:0.85rem 1.75rem;background:#E67E22;color:white;text-decoration:none;border-radius:999px;font-weight:700;font-size:0.9rem;margin-top:1.25rem;}
  .info-box{background:rgba(245,158,11,0.08);border-left:3px solid #E67E22;border-radius:0 8px 8px 0;padding:0.85rem 1rem;font-size:0.85rem;color:#92400e;line-height:1.55;margin-top:1rem;}
  .footer{font-size:0.78rem;color:#7A8699;text-align:center;margin-top:2rem;line-height:1.6;}
</style>
</head>
<body>
<div class="wrap">
  <div class="logo">RESER<span>-VE</span></div>
  ${content}
  <div class="footer">RESER-VE · La plataforma de posadas auténticas de Venezuela<br/>Este es un correo automático, no respondas a este mensaje.</div>
</div>
</body>
</html>`
}

// ─── Email: new booking (to host) ─────────────────────────────────────────────
export async function emailHostNewBooking(opts: {
  hostEmail: string; hostName: string;
  guestName: string; guestEmail: string;
  posadaNombre: string; bookingCode: string;
  checkIn: string; checkOut: string; nights: number;
  totalPrice: number; paymentMethod: string | null; guestCount: number;
  notes?: string | null;
}) {
  const resend = getResend()
  if (!resend && !process.env.BREVO_API_KEY) return false

  const html = baseHtml(`
    <div class="card">
      <div class="title">Nueva solicitud de reserva</div>
      <div class="sub">Responde en menos de 24 horas: las solicitudes sin respuesta se cancelan automáticamente.</div>
      <div class="code-box"><div class="code">${esc(opts.bookingCode)}</div></div>
      <div class="row"><span>Posada</span><strong>${esc(opts.posadaNombre)}</strong></div>
      <div class="row"><span>Viajero</span><strong>${esc(opts.guestName)}</strong></div>
      <div class="row"><span>Check-in</span><strong>${esc(opts.checkIn)}</strong></div>
      <div class="row"><span>Check-out</span><strong>${esc(opts.checkOut)}</strong></div>
      <div class="row"><span>Noches</span><strong>${opts.nights}</strong></div>
      <div class="row"><span>Huéspedes</span><strong>${opts.guestCount}</strong></div>
      <div class="row"><span>Método de pago</span><strong>${esc(opts.paymentMethod ?? '—')}</strong></div>
      <div class="divider"></div>
      <div class="row"><span>Precio que paga el huésped</span><strong>$${opts.totalPrice} USD</strong></div>
      <div class="total"><span>Tu ingreso</span><span>$${hostNet(opts.totalPrice)} USD</span></div>
      ${opts.notes ? `<div class="info-box"><strong>Nota del viajero:</strong> ${esc(opts.notes)}</div>` : ''}
      <div class="info-box"><strong>Próximos pasos:</strong> confirma o rechaza desde tu panel. Si confirmas, envíale tus datos de pago al viajero por el <strong>chat de RESER-VE</strong> (nunca por fuera de la plataforma).</div>
      <a href="${SITE_URL}/dashboard/reservas" class="btn">Gestionar reserva →</a>
    </div>
  `)

  return deliver(resend, {
    from: FROM,
    to: opts.hostEmail,
    subject: `Nueva reserva: ${opts.bookingCode} · ${opts.posadaNombre}`,
    html,
  })
}

// ─── Email: booking received (to guest) ───────────────────────────────────────
export async function emailGuestBookingReceived(opts: {
  guestEmail: string; guestName: string;
  posadaNombre: string; bookingCode: string;
  checkIn: string; checkOut: string; nights: number;
  totalPrice: number; paymentMethod: string | null;
}) {
  const resend = getResend()
  if (!resend && !process.env.BREVO_API_KEY) return false

  const html = baseHtml(`
    <div class="card">
      <div class="title">¡Solicitud enviada!</div>
      <div class="sub">Hola ${esc(opts.guestName)}, recibimos tu solicitud. El posadero tiene 24 h para responder. Te avisamos por correo en cuanto haya respuesta.</div>
      <div class="code-box">
        <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#7A8699;margin-bottom:0.4rem;">Código de reserva</div>
        <div class="code">${esc(opts.bookingCode)}</div>
      </div>
      <div class="row"><span>Posada</span><strong>${esc(opts.posadaNombre)}</strong></div>
      <div class="row"><span>Check-in</span><strong>${esc(opts.checkIn)}</strong></div>
      <div class="row"><span>Check-out</span><strong>${esc(opts.checkOut)}</strong></div>
      <div class="row"><span>Noches</span><strong>${opts.nights}</strong></div>
      <div class="divider"></div>
      <div class="total"><span>Total</span><span>$${opts.totalPrice} USD</span></div>
      <div class="info-box">Sin cargos hasta que el posadero confirme. Guarda tu código de reserva para cualquier consulta.</div>
      <a href="${SITE_URL}/mis-reservas" class="btn">Ver mis reservas →</a>
    </div>
  `)

  return deliver(resend, {
    from: FROM,
    to: opts.guestEmail,
    subject: `Solicitud recibida: ${opts.bookingCode} · ${opts.posadaNombre}`,
    html,
  })
}

// ─── Email: booking confirmed (to guest) ──────────────────────────────────────
export async function emailGuestBookingConfirmed(opts: {
  guestEmail: string; guestName: string;
  posadaNombre: string; bookingCode: string;
  checkIn: string; checkOut: string; nights: number;
  totalPrice: number; paymentMethod: string | null;
  hostNotes?: string | null;
}) {
  const resend = getResend()
  if (!resend && !process.env.BREVO_API_KEY) return false

  const instruccion = `El posadero te enviará sus datos de pago${opts.paymentMethod ? ` (${esc(opts.paymentMethod)})` : ''} por el chat de RESER-VE: entra a <a href="${SITE_URL}/mensajes">Mis mensajes</a>. Monto: $${opts.totalPrice} USD · referencia ${opts.bookingCode}. Por tu seguridad, paga solo a datos recibidos dentro de la plataforma.`

  const html = baseHtml(`
    <div class="card">
      <div class="title">✓ Reserva confirmada</div>
      <div class="sub">Hola ${esc(opts.guestName)}, el posadero confirmó tu reserva. Procede con el pago para asegurar tu lugar.</div>
      <div class="code-box">
        <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#7A8699;margin-bottom:0.4rem;">Código de reserva</div>
        <div class="code">${esc(opts.bookingCode)}</div>
      </div>
      <div class="row"><span>Posada</span><strong>${esc(opts.posadaNombre)}</strong></div>
      <div class="row"><span>Check-in</span><strong>${esc(opts.checkIn)}</strong></div>
      <div class="row"><span>Check-out</span><strong>${esc(opts.checkOut)}</strong></div>
      <div class="row"><span>Noches</span><strong>${opts.nights}</strong></div>
      <div class="divider"></div>
      <div class="total"><span>Total a pagar</span><span>$${opts.totalPrice} USD</span></div>
      <div class="info-box"><strong>Instrucciones de pago:</strong><br/>${instruccion}</div>
      ${opts.hostNotes ? `<div class="info-box" style="margin-top:0.75rem"><strong>Mensaje del posadero:</strong> ${esc(opts.hostNotes)}</div>` : ''}
    </div>
  `)

  return deliver(resend, {
    from: FROM,
    to: opts.guestEmail,
    subject: `Reserva confirmada: ${opts.bookingCode} · ${opts.posadaNombre}`,
    html,
  })
}

// ─── Email: booking cancelled ─────────────────────────────────────────────────
export async function emailGuestBookingCancelled(opts: {
  guestEmail: string; guestName: string;
  posadaNombre: string; bookingCode: string;
  reason?: string | null;
  wasConfirmed?: boolean;
}) {
  const resend = getResend()
  if (!resend && !process.env.BREVO_API_KEY) return false

  const html = baseHtml(`
    <div class="card">
      <div class="title">${opts.wasConfirmed ? 'Reserva cancelada' : 'Reserva no confirmada'}</div>
      <div class="sub">Hola ${esc(opts.guestName)}, ${opts.wasConfirmed ? 'el posadero canceló tu reserva en' : 'lamentablemente el posadero no pudo confirmar tu solicitud para'} <strong>${esc(opts.posadaNombre)}</strong>. Si ya habías pagado, escríbele por el chat de RESER-VE o contáctanos para gestionar el reembolso.</div>
      <div class="code-box"><div class="code">${esc(opts.bookingCode)}</div></div>
      ${opts.reason ? `<div class="info-box"><strong>Motivo:</strong> ${esc(opts.reason)}</div>` : ''}
      ${opts.wasConfirmed ? '' : '<div style="margin-top:1rem;font-size:0.85rem;color:#7A8699;">Sin cargos — no se realizó ningún cobro. Te invitamos a explorar otras posadas disponibles.</div>'}
      <a href="${SITE_URL}/buscar" class="btn">Explorar otras posadas →</a>
    </div>
  `)

  return deliver(resend, {
    from: FROM,
    to: opts.guestEmail,
    subject: `Reserva ${opts.bookingCode} — ${opts.wasConfirmed ? 'Cancelada' : 'No confirmada'}`,
    html,
  })
}

// ─── Email: posada recibida y en revisión (al posadero) ─────────────────────
export async function emailHostPosadaReceived(opts: { hostEmail: string; hostName: string; posadaNombre: string }) {
  const resend = getResend()
  if (!resend && !process.env.BREVO_API_KEY) return false
  const html = baseHtml(`
    <div class="card">
      <div class="title">Recibimos tu posada</div>
      <div class="sub">Hola ${esc(opts.hostName)}, <strong>${esc(opts.posadaNombre)}</strong> está en revisión. Nuestro equipo la revisará en 24–72 horas y te avisaremos por correo en cuanto esté publicada. Si falta algo, te diremos exactamente qué ajustar.</div>
      <div class="info-box">RESER-VE está en fase privada: tu posada se verá en la web y estará lista desde el primer día cuando abramos las reservas al público.</div>
      <a href="${SITE_URL}/dashboard" class="btn">Ir a mi panel →</a>
    </div>
  `)
  return deliver(resend, { from: FROM, to: opts.hostEmail, subject: `Recibimos ${opts.posadaNombre} · en revisión`, html })
}

// ─── Email: el viajero canceló (al posadero) ─────────────────────────────────
export async function emailHostGuestCancelled(opts: { hostEmail: string; hostName: string; guestName: string; posadaNombre: string; bookingCode: string; checkIn: string; checkOut: string }) {
  const resend = getResend()
  if (!resend && !process.env.BREVO_API_KEY) return false
  const html = baseHtml(`
    <div class="card">
      <div class="title">Reserva cancelada por el viajero</div>
      <div class="sub">Hola ${esc(opts.hostName)}, ${esc(opts.guestName)} canceló su reserva en <strong>${esc(opts.posadaNombre)}</strong> (${esc(opts.checkIn)} → ${esc(opts.checkOut)}). Esas fechas vuelven a estar disponibles.</div>
      <div class="code-box"><div class="code">${esc(opts.bookingCode)}</div></div>
      <a href="${SITE_URL}/dashboard/reservas" class="btn">Ver mis reservas →</a>
    </div>
  `)
  return deliver(resend, { from: FROM, to: opts.hostEmail, subject: `Cancelada por el viajero: ${opts.bookingCode} · ${opts.posadaNombre}`, html })
}

// ─── Email: posada approved (to host) ─────────────────────────────────────────
export async function emailHostPosadaApproved(opts: {
  hostEmail: string; hostName: string; posadaNombre: string; slug: string;
}) {
  const resend = getResend()
  if (!resend && !process.env.BREVO_API_KEY) return false

  const html = baseHtml(`
    <div class="card">
      <div class="title">✓ Tu posada está publicada</div>
      <div class="sub">Hola ${esc(opts.hostName)}, revisamos y aprobamos <strong>${esc(opts.posadaNombre)}</strong>. Ya está visible para los viajeros.</div>
      <a href="${SITE_URL}/posadas/${opts.slug}" class="btn">Ver mi posada →</a>
    </div>
  `)

  return deliver(resend, {
    from: FROM,
    to: opts.hostEmail,
    subject: `${opts.posadaNombre} ya está publicada en RESER-VE`,
    html,
  })
}

// ─── Email: welcome (to new user) ─────────────────────────────────────────────
export async function emailWelcome(opts: {
  email: string; name: string; role: 'traveler' | 'host' | 'admin';
}) {
  const resend = getResend()
  if (!resend && !process.env.BREVO_API_KEY) return false

  const isHost = opts.role === 'host'
  const html = baseHtml(`
    <div class="card">
      <div class="title">Bienvenido/a a RESER-VE</div>
      <div class="sub">Hola ${esc(opts.name)}, tu cuenta ha sido creada. ${isHost
        ? 'Ya puedes publicar tu posada desde tu panel: fotos, habitaciones, precio y métodos de pago. Nuestro equipo la revisa en 24–72 horas y te avisamos por correo cuando esté publicada.'
        : 'Ya puedes explorar las posadas más auténticas de Venezuela y guardar tus favoritas. Estamos en fase privada: te avisaremos por correo cuando se abran las reservas.'}</div>
      ${isHost
        ? `<a href="${SITE_URL}/dashboard/posada/nueva" class="btn">Publicar mi posada →</a>`
        : `<a href="${SITE_URL}/buscar" class="btn">Explorar posadas →</a>`
      }
      ${isHost ? `<div class="info-box" style="margin-top:1.25rem"><strong>Condiciones:</strong> publicar es gratis y sin mensualidad; solo pagas un 10% sobre las reservas confirmadas. El precio publicado debe ser el mismo que en tus otros canales. <a href="${SITE_URL}/docs/Guia-Posaderos-RESER-VE.pdf">Descarga la guía para posaderos</a>.</div>` : ''}
      <div class="info-box" style="margin-top:1rem">¿Dudas? Escríbenos a hola@reser-ve.com o usa el asistente de ayuda (botón naranja) en la web.</div>
    </div>
  `)

  return deliver(resend, {
    from: FROM,
    to: opts.email,
    subject: `Bienvenido/a a RESER-VE, ${opts.name}`,
    html,
  })
}

// ─── Email: nueva solicitud de registro de posada (al equipo) ─────────────────
export async function emailPosadaLead(opts: {
  nombrePosada: string; destino: string; tipo: string; descripcion: string;
  habitaciones: string; capacidad: string; precio: string; servicios: string[];
  nombrePosadero: string; emailPosadero: string; telefono?: string; whatsapp?: string;
  metodoCobro: string[];
  to?: string[];
}) {
  const resend = getResend()
  if (!resend && !process.env.BREVO_API_KEY) return false

  const to = opts.to?.length ? opts.to : (process.env.TEAM_EMAIL || 'hola@reser-ve.com')
  const html = baseHtml(`
    <div class="card">
      <div class="title">Nueva solicitud de posada</div>
      <div class="sub">Un posadero quiere unirse a RESER-VE. Contáctalo para verificar y activar el perfil.</div>
      <div class="row"><span>Posada</span><strong>${esc(opts.nombrePosada)}</strong></div>
      <div class="row"><span>Destino</span><strong>${esc(opts.destino)}</strong></div>
      <div class="row"><span>Tipo</span><strong>${esc(opts.tipo)}</strong></div>
      <div class="row"><span>Habitaciones</span><strong>${esc(opts.habitaciones)} · ${esc(opts.capacidad)} personas</strong></div>
      <div class="row"><span>Precio base</span><strong>$${esc(opts.precio)} USD/noche</strong></div>
      <div class="row"><span>Servicios</span><strong>${esc(opts.servicios.join(', ')) || '—'}</strong></div>
      <div class="divider"></div>
      <div class="row"><span>Posadero/a</span><strong>${esc(opts.nombrePosadero)}</strong></div>
      <div class="row"><span>Email</span><strong>${esc(opts.emailPosadero)}</strong></div>
      <div class="row"><span>Teléfono</span><strong>${esc(opts.telefono || '—')}</strong></div>
      <div class="row"><span>WhatsApp</span><strong>${esc(opts.whatsapp || '—')}</strong></div>
      <div class="row"><span>Métodos de cobro</span><strong>${esc(opts.metodoCobro.join(', ')) || '—'}</strong></div>
      <div class="info-box" style="margin-top:1rem"><strong>Descripción:</strong><br/>${esc(opts.descripcion)}</div>
    </div>
  `)

  return deliver(resend, {
    from: FROM,
    to,
    replyTo: opts.emailPosadero,
    subject: `Nueva posada: ${opts.nombrePosada} (${opts.destino})`,
    html,
  })
}

// ─── Email: posada enviada a revisión (a los admins) ─────────────────────────
export async function emailAdminPosadaPending(opts: {
  to: string[]; nombre: string; destino: string; precio: number;
  hostName: string; hostEmail: string;
}) {
  const resend = getResend()
  if ((!resend && !process.env.BREVO_API_KEY) || opts.to.length === 0) return false
  const html = baseHtml(`
    <div class="card">
      <div class="title">Posada pendiente de revisión</div>
      <div class="sub">Un posadero acaba de enviar su posada. Revísala y apruébala para que aparezca en el buscador.</div>
      <div class="row"><span>Posada</span><strong>${esc(opts.nombre)}</strong></div>
      <div class="row"><span>Destino</span><strong>${esc(opts.destino)}</strong></div>
      <div class="row"><span>Precio</span><strong>$${esc(opts.precio)} USD/noche</strong></div>
      <div class="row"><span>Posadero/a</span><strong>${esc(opts.hostName)} · ${esc(opts.hostEmail)}</strong></div>
      <a href="${SITE_URL}/admin" class="btn">Revisar en el panel →</a>
    </div>
  `)
  return deliver(resend, {
    from: FROM, to: opts.to, replyTo: opts.hostEmail,
    subject: `Revisar posada: ${opts.nombre} (${opts.destino})`, html,
  })
}

// ─── Email: posada publicada editada (a los admins) ──────────────────────────
const FIELD_LABELS: Record<string, string> = {
  nombre: 'Nombre', descripcion: 'Descripción', precio: 'Precio', imgs: 'Fotos', destino: 'Destino', destinoSlug: 'Destino',
  lat: 'Ubicación', lng: 'Ubicación', habitaciones: 'Habitaciones', capacidad: 'Capacidad', tipo: 'Tipo',
  tags: 'Etiquetas', servicios: 'Servicios', politicas: 'Políticas', metodoPago: 'Métodos de pago',
}
export async function emailAdminPosadaEdited(opts: {
  to: string[]; nombre: string; destino: string; precio: number; slug: string; changed: string[];
  hostName: string; hostEmail: string;
}) {
  const resend = getResend()
  if ((!resend && !process.env.BREVO_API_KEY) || opts.to.length === 0) return false
  const campos = [...new Set(opts.changed.map(k => FIELD_LABELS[k] ?? k))].join(', ')
  const html = baseHtml(`
    <div class="card">
      <div class="title">Posada publicada editada</div>
      <div class="sub">${esc(opts.hostName)} modificó <strong>${esc(opts.nombre)}</strong> (${esc(opts.destino)}). Los cambios ya están visibles: revísalos.</div>
      <div class="row"><span>Cambios</span><strong>${esc(campos)}</strong></div>
      <div class="row"><span>Precio actual</span><strong>$${opts.precio} USD/noche</strong></div>
      <a href="${SITE_URL}/posadas/${opts.slug}" class="btn">Ver la posada →</a>
    </div>
  `)
  return deliver(resend, { from: FROM, to: opts.to, replyTo: opts.hostEmail || undefined, subject: `Posada editada: ${opts.nombre}`, html })
}

// ─── Email: restablecer contraseña ─────────────────────────────────────────────
export async function emailPasswordReset(opts: { email: string; name: string; resetUrl: string }) {
  const resend = getResend()
  if (!resend && !process.env.BREVO_API_KEY) return false

  const html = baseHtml(`
    <div class="card">
      <div class="title">Restablece tu contraseña</div>
      <div class="sub">Hola ${esc(opts.name)}, recibimos una solicitud para restablecer tu contraseña en RESER-VE. Pulsa el botón para crear una nueva. El enlace vence en 1 hora.</div>
      <a href="${opts.resetUrl}" class="btn">Crear nueva contraseña →</a>
      <div class="info-box" style="margin-top:1.25rem">Si no solicitaste esto, ignora este correo — tu contraseña seguirá igual.</div>
    </div>
  `)

  return deliver(resend, {
    from: FROM,
    to: opts.email,
    subject: 'Restablece tu contraseña · RESER-VE',
    html,
  })
}

// ─── Email: new message notification ──────────────────────────────────────────
export async function emailNewMessage(opts: {
  recipientEmail: string; recipientName: string;
  senderName: string; subject: string; body: string; conversationId: number;
}) {
  const resend = getResend()
  if (!resend && !process.env.BREVO_API_KEY) return false

  const html = baseHtml(`
    <div class="card">
      <div class="title">Nuevo mensaje de ${esc(opts.senderName)}</div>
      <div class="sub">Tienes un mensaje nuevo en la conversación: <strong>${esc(opts.subject)}</strong></div>
      <div style="background:rgba(26,43,76,0.04);border-radius:12px;padding:1rem 1.2rem;margin:1rem 0;font-size:0.88rem;line-height:1.6;color:#1A2B4C;">${esc(opts.body)}</div>
      <a href="${SITE_URL}/mensajes/${opts.conversationId}" class="btn">Responder →</a>
    </div>
  `)

  return deliver(resend, {
    from: FROM,
    to: opts.recipientEmail,
    subject: `Nuevo mensaje: ${opts.subject}`,
    html,
  })
}

// ─── Email: posada rejected (to host) ─────────────────────────────────────────
export async function emailHostPosadaRejected(opts: {
  hostEmail: string; hostName: string; posadaNombre: string; notes: string;
}) {
  const resend = getResend()
  if (!resend && !process.env.BREVO_API_KEY) return false

  const html = baseHtml(`
    <div class="card">
      <div class="title">Posada en revisión</div>
      <div class="sub">Hola ${esc(opts.hostName)}, revisamos <strong>${esc(opts.posadaNombre)}</strong> y necesitamos que hagas algunos ajustes antes de publicarla.</div>
      <div class="info-box"><strong>Comentarios del equipo RESER-VE:</strong><br/>${esc(opts.notes)}</div>
      <div style="margin-top:1rem;font-size:0.85rem;color:#7A8699;">Realiza los cambios y vuelve a enviar desde tu dashboard. Estamos aquí para ayudarte.</div>
      <a href="${SITE_URL}/dashboard" class="btn">Ir a mi dashboard →</a>
    </div>
  `)

  return deliver(resend, {
    from: FROM,
    to: opts.hostEmail,
    subject: `Tu posada ${opts.posadaNombre} necesita ajustes`,
    html,
  })
}
