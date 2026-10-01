import { NextRequest, NextResponse, after } from 'next/server'
import { Resend } from 'resend'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Webhook de Resend (email.received): cada correo que llega a @reser-ve.com
// (p. ej. hola@reser-ve.com) se reenvía a los admins. Responder desde Gmail le
// contesta directamente al remitente original (reply-to).
export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  const key = process.env.RESEND_API_KEY
  if (!secret || !key) return NextResponse.json({ error: 'No configurado' }, { status: 503 })

  const payload = await req.text()
  const resend = new Resend(key)
  let event: any
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: req.headers.get('svix-id') ?? '',
        timestamp: req.headers.get('svix-timestamp') ?? '',
        signature: req.headers.get('svix-signature') ?? '',
      },
      webhookSecret: secret,
    })
  } catch {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }
  if (event?.type !== 'email.received') return NextResponse.json({ ok: true })

  const emailId: string = event.data.email_id
  after(async () => {
    const { data: mail } = await resend.emails.receiving.get(emailId)
    if (!mail) return
    const admins = await getDb().select({ email: users.email }).from(users).where(eq(users.role, 'admin'))
    // Nunca reenviar a direcciones del propio dominio (evita bucles).
    const to = admins.map(a => a.email).filter(e => !/@([\w-]+\.)*reser-ve\.com$/i.test(e))
    if (to.length === 0) return
    const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
    const header = `<div style="font-family:Arial,sans-serif;font-size:13px;color:#555;border-bottom:1px solid #ddd;padding-bottom:8px;margin-bottom:12px">
      📥 Recibido en <b>${esc(mail.to.join(', '))}</b><br/>De: <b>${esc(mail.from)}</b><br/>
      Responde a este correo para contestarle directamente · <a href="https://reser-ve.com/admin/correo?id=${mail.id}">Ver en el panel</a></div>`
    const { error } = await resend.emails.send({
      from: 'RESER-VE Buzón <hola@reser-ve.com>',
      to,
      replyTo: mail.reply_to?.[0] ?? mail.from,
      subject: `[hola@] ${mail.subject || '(sin asunto)'}`,
      // Solo texto: el HTML del remitente podría simular contenido de RESER-VE (phishing).
      html: header + `<pre style="white-space:pre-wrap;font-family:Arial,sans-serif;font-size:14px">${esc((mail.text ?? (mail.html ?? '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ')).slice(0, 20000))}</pre>`,
    })
    if (error) console.error('[inbound] reenvío falló', error)
  })
  return NextResponse.json({ ok: true })
}
