import { Resend } from 'resend'

// Only initialize if API key is present — avoids build-time crash
function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM = 'RESER-VE <reservas@reser-ve.com>'

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
  if (!resend) return

  const html = baseHtml(`
    <div class="card">
      <div class="title">Nueva solicitud de reserva</div>
      <div class="sub">Tienes 24 horas para confirmar o rechazar. Si no respondes, la reserva se cancela automáticamente.</div>
      <div class="code-box"><div class="code">${opts.bookingCode}</div></div>
      <div class="row"><span>Posada</span><strong>${opts.posadaNombre}</strong></div>
      <div class="row"><span>Viajero</span><strong>${opts.guestName}</strong></div>
      <div class="row"><span>Email</span><strong>${opts.guestEmail}</strong></div>
      <div class="row"><span>Check-in</span><strong>${opts.checkIn}</strong></div>
      <div class="row"><span>Check-out</span><strong>${opts.checkOut}</strong></div>
      <div class="row"><span>Noches</span><strong>${opts.nights}</strong></div>
      <div class="row"><span>Huéspedes</span><strong>${opts.guestCount}</strong></div>
      <div class="row"><span>Método de pago</span><strong>${opts.paymentMethod ?? '—'}</strong></div>
      <div class="divider"/>
      <div class="total"><span>Total a cobrar</span><span>$${opts.totalPrice} USD</span></div>
      ${opts.notes ? `<div class="info-box"><strong>Nota del viajero:</strong> ${opts.notes}</div>` : ''}
      <a href="https://reserve-ve.vercel.app/dashboard/reservas" class="btn">Gestionar reserva →</a>
    </div>
  `)

  await resend.emails.send({
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
  if (!resend) return

  const html = baseHtml(`
    <div class="card">
      <div class="title">¡Solicitud enviada!</div>
      <div class="sub">Hola ${opts.guestName}, recibimos tu solicitud. El posadero tiene 24h para confirmar. Te avisamos en cuanto haya respuesta.</div>
      <div class="code-box">
        <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#7A8699;margin-bottom:0.4rem;">Código de reserva</div>
        <div class="code">${opts.bookingCode}</div>
      </div>
      <div class="row"><span>Posada</span><strong>${opts.posadaNombre}</strong></div>
      <div class="row"><span>Check-in</span><strong>${opts.checkIn}</strong></div>
      <div class="row"><span>Check-out</span><strong>${opts.checkOut}</strong></div>
      <div class="row"><span>Noches</span><strong>${opts.nights}</strong></div>
      <div class="divider"/>
      <div class="total"><span>Total</span><span>$${opts.totalPrice} USD</span></div>
      <div class="info-box">Sin cargos hasta que el posadero confirme. Guarda tu código de reserva para cualquier consulta.</div>
      <a href="https://reserve-ve.vercel.app/mis-reservas" class="btn">Ver mis reservas →</a>
    </div>
  `)

  await resend.emails.send({
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
  if (!resend) return

  const instrucciones: Record<string, string> = {
    Zelle: `Transfiere $${opts.totalPrice} USD a zelle@reser-ve.com. Escribe el código ${opts.bookingCode} en el concepto.`,
    Zinli: `Envía $${opts.totalPrice} USD a @reserveve en Zinli. Incluye el código ${opts.bookingCode}.`,
    'Pago Móvil': `Pago Móvil al 0412-5550000, RIF J-40055123-4. Monto equivalente a $${opts.totalPrice} USD. Concepto: ${opts.bookingCode}.`,
  }
  const instruccion = instrucciones[opts.paymentMethod ?? ''] ?? `Contacta a RESER-VE con el código ${opts.bookingCode} para coordinar el pago de $${opts.totalPrice} USD.`

  const html = baseHtml(`
    <div class="card">
      <div class="title">✓ Reserva confirmada</div>
      <div class="sub">Hola ${opts.guestName}, el posadero confirmó tu reserva. Procede con el pago para asegurar tu lugar.</div>
      <div class="code-box">
        <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#7A8699;margin-bottom:0.4rem;">Código de reserva</div>
        <div class="code">${opts.bookingCode}</div>
      </div>
      <div class="row"><span>Posada</span><strong>${opts.posadaNombre}</strong></div>
      <div class="row"><span>Check-in</span><strong>${opts.checkIn}</strong></div>
      <div class="row"><span>Check-out</span><strong>${opts.checkOut}</strong></div>
      <div class="row"><span>Noches</span><strong>${opts.nights}</strong></div>
      <div class="divider"/>
      <div class="total"><span>Total a pagar</span><span>$${opts.totalPrice} USD</span></div>
      <div class="info-box"><strong>Instrucciones de pago:</strong><br/>${instruccion}</div>
      ${opts.hostNotes ? `<div class="info-box" style="margin-top:0.75rem"><strong>Mensaje del posadero:</strong> ${opts.hostNotes}</div>` : ''}
    </div>
  `)

  await resend.emails.send({
    from: FROM,
    to: opts.guestEmail,
    subject: `✓ Confirmada: ${opts.bookingCode} · ${opts.posadaNombre}`,
    html,
  })
}

// ─── Email: booking cancelled ─────────────────────────────────────────────────
export async function emailGuestBookingCancelled(opts: {
  guestEmail: string; guestName: string;
  posadaNombre: string; bookingCode: string;
  reason?: string | null;
}) {
  const resend = getResend()
  if (!resend) return

  const html = baseHtml(`
    <div class="card">
      <div class="title">Reserva no confirmada</div>
      <div class="sub">Hola ${opts.guestName}, lamentablemente el posadero no pudo confirmar tu solicitud para <strong>${opts.posadaNombre}</strong>.</div>
      <div class="code-box"><div class="code">${opts.bookingCode}</div></div>
      ${opts.reason ? `<div class="info-box"><strong>Motivo:</strong> ${opts.reason}</div>` : ''}
      <div style="margin-top:1rem;font-size:0.85rem;color:#7A8699;">Sin cargos — no se realizó ningún cobro. Te invitamos a explorar otras posadas disponibles.</div>
      <a href="https://reserve-ve.vercel.app/buscar" class="btn">Explorar otras posadas →</a>
    </div>
  `)

  await resend.emails.send({
    from: FROM,
    to: opts.guestEmail,
    subject: `Reserva ${opts.bookingCode} — No confirmada`,
    html,
  })
}

// ─── Email: posada approved (to host) ─────────────────────────────────────────
export async function emailHostPosadaApproved(opts: {
  hostEmail: string; hostName: string; posadaNombre: string; slug: string;
}) {
  const resend = getResend()
  if (!resend) return

  const html = baseHtml(`
    <div class="card">
      <div class="title">✓ Tu posada está publicada</div>
      <div class="sub">Hola ${opts.hostName}, revisamos y aprobamos <strong>${opts.posadaNombre}</strong>. Ya está visible para los viajeros.</div>
      <a href="https://reserve-ve.vercel.app/posadas/${opts.slug}" class="btn">Ver mi posada →</a>
    </div>
  `)

  await resend.emails.send({
    from: FROM,
    to: opts.hostEmail,
    subject: `✓ ${opts.posadaNombre} ya está publicada en RESER-VE`,
    html,
  })
}

// ─── Email: welcome (to new user) ─────────────────────────────────────────────
export async function emailWelcome(opts: {
  email: string; name: string; role: 'traveler' | 'host' | 'admin';
}) {
  const resend = getResend()
  if (!resend) return

  const isHost = opts.role === 'host'
  const html = baseHtml(`
    <div class="card">
      <div class="title">Bienvenido/a a RESER-VE 🎉</div>
      <div class="sub">Hola ${opts.name}, tu cuenta ha sido creada. ${isHost ? 'Como posadero ya puedes publicar tu primera posada y comenzar a recibir viajeros.' : 'Ya puedes explorar las mejores posadas de Venezuela y hacer tu primera reserva.'}</div>
      ${isHost
        ? `<a href="https://reserve-ve.vercel.app/dashboard/posada/nueva" class="btn">Publicar mi posada →</a>`
        : `<a href="https://reserve-ve.vercel.app/buscar" class="btn">Explorar posadas →</a>`
      }
      <div class="info-box" style="margin-top:1.25rem">¿Tienes alguna pregunta? Escríbenos a través del servicio al cliente en la plataforma o responde a este correo.</div>
    </div>
  `)

  await resend.emails.send({
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
}) {
  const resend = getResend()
  if (!resend) return

  const to = process.env.TEAM_EMAIL || 'hola@reser-ve.com'
  const html = baseHtml(`
    <div class="card">
      <div class="title">Nueva solicitud de posada</div>
      <div class="sub">Un posadero quiere unirse a RESER-VE. Contáctalo para verificar y activar el perfil.</div>
      <div class="row"><span>Posada</span><strong>${opts.nombrePosada}</strong></div>
      <div class="row"><span>Destino</span><strong>${opts.destino}</strong></div>
      <div class="row"><span>Tipo</span><strong>${opts.tipo}</strong></div>
      <div class="row"><span>Habitaciones</span><strong>${opts.habitaciones} · ${opts.capacidad} personas</strong></div>
      <div class="row"><span>Precio base</span><strong>$${opts.precio} USD/noche</strong></div>
      <div class="row"><span>Servicios</span><strong>${opts.servicios.join(', ') || '—'}</strong></div>
      <div class="divider"/>
      <div class="row"><span>Posadero/a</span><strong>${opts.nombrePosadero}</strong></div>
      <div class="row"><span>Email</span><strong>${opts.emailPosadero}</strong></div>
      <div class="row"><span>Teléfono</span><strong>${opts.telefono || '—'}</strong></div>
      <div class="row"><span>WhatsApp</span><strong>${opts.whatsapp || '—'}</strong></div>
      <div class="row"><span>Métodos de cobro</span><strong>${opts.metodoCobro.join(', ') || '—'}</strong></div>
      <div class="info-box" style="margin-top:1rem"><strong>Descripción:</strong><br/>${opts.descripcion}</div>
    </div>
  `)

  await resend.emails.send({
    from: FROM,
    to,
    replyTo: opts.emailPosadero,
    subject: `Nueva posada: ${opts.nombrePosada} (${opts.destino})`,
    html,
  })
}

// ─── Email: new message notification ──────────────────────────────────────────
export async function emailNewMessage(opts: {
  recipientEmail: string; recipientName: string;
  senderName: string; subject: string; body: string; conversationId: number;
}) {
  const resend = getResend()
  if (!resend) return

  const html = baseHtml(`
    <div class="card">
      <div class="title">Nuevo mensaje de ${opts.senderName}</div>
      <div class="sub">Tienes un mensaje nuevo en la conversación: <strong>${opts.subject}</strong></div>
      <div style="background:rgba(26,43,76,0.04);border-radius:12px;padding:1rem 1.2rem;margin:1rem 0;font-size:0.88rem;line-height:1.6;color:#1A2B4C;">${opts.body}</div>
      <a href="https://reserve-ve.vercel.app/mensajes/${opts.conversationId}" class="btn">Responder →</a>
    </div>
  `)

  await resend.emails.send({
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
  if (!resend) return

  const html = baseHtml(`
    <div class="card">
      <div class="title">Posada en revisión</div>
      <div class="sub">Hola ${opts.hostName}, revisamos <strong>${opts.posadaNombre}</strong> y necesitamos que hagas algunos ajustes antes de publicarla.</div>
      <div class="info-box"><strong>Comentarios del equipo RESER-VE:</strong><br/>${opts.notes}</div>
      <div style="margin-top:1rem;font-size:0.85rem;color:#7A8699;">Realiza los cambios y vuelve a enviar desde tu dashboard. Estamos aquí para ayudarte.</div>
      <a href="https://reserve-ve.vercel.app/dashboard" class="btn">Ir a mi dashboard →</a>
    </div>
  `)

  await resend.emails.send({
    from: FROM,
    to: opts.hostEmail,
    subject: `Tu posada ${opts.posadaNombre} necesita ajustes`,
    html,
  })
}
