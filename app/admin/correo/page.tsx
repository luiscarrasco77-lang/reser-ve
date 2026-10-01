import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Resend } from 'resend'
import Link from 'next/link'

// Bandeja de entrada de @reser-ve.com (hola@, etc.) leída desde Resend Receiving.
export default async function CorreoPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') redirect('/login?callbackUrl=/admin/correo')
  const { id } = await searchParams
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
  const list = resend ? (await resend.emails.receiving.list({ limit: 50 })).data?.data ?? [] : []
  const open = resend && id ? (await resend.emails.receiving.get(id)).data : null
  const fmt = (d: string) => new Date(d).toLocaleString('es-VE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Caracas' })

  return (
    <div style={{ minHeight: '100vh', background: '#FDFBF7', fontFamily: "'Inter',system-ui,sans-serif", color: '#1A2B4C' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.25rem' }}>
        <Link href="/admin" style={{ color: '#7A8699', textDecoration: 'none', fontSize: '.85rem' }}>← Volver al panel</Link>
        <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.8rem', margin: '.6rem 0 .2rem' }}>Correo recibido</h1>
        <p style={{ color: '#7A8699', fontSize: '.88rem', margin: '0 0 1.5rem' }}>
          Todo lo que llega a <b>hola@reser-ve.com</b> (o cualquier dirección @reser-ve.com). También se reenvía a los correos de los admins; para responder, contesta desde tu Gmail.
        </p>
        {!resend && <p>Falta RESEND_API_KEY.</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 380px) 1fr', gap: '1rem', alignItems: 'start' }}>
          <div style={{ background: 'white', border: '1px solid rgba(26,43,76,.1)', borderRadius: 14, overflow: 'hidden' }}>
            {list.length === 0 && <div style={{ padding: '1.2rem', color: '#7A8699', fontSize: '.88rem' }}>Aún no ha llegado ningún correo.</div>}
            {list.map(m => (
              <Link key={m.id} href={`/admin/correo?id=${m.id}`} style={{ display: 'block', padding: '.8rem 1rem', borderBottom: '1px solid rgba(26,43,76,.07)', textDecoration: 'none', color: 'inherit', background: m.id === id ? 'rgba(230,126,34,.08)' : 'white' }}>
                <div style={{ fontSize: '.78rem', color: '#7A8699' }}>{m.from} · {fmt(m.created_at)}</div>
                <div style={{ fontWeight: 700, fontSize: '.9rem', marginTop: 2 }}>{m.subject || '(sin asunto)'}</div>
                <div style={{ fontSize: '.72rem', color: '#C96510', marginTop: 2 }}>para {m.to.join(', ')}</div>
              </Link>
            ))}
          </div>
          <div style={{ background: 'white', border: '1px solid rgba(26,43,76,.1)', borderRadius: 14, padding: '1.2rem', minHeight: 300 }}>
            {open ? (
              <>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{open.subject || '(sin asunto)'}</div>
                <div style={{ fontSize: '.82rem', color: '#7A8699', margin: '.3rem 0 1rem' }}>De <b>{open.from}</b> · para {open.to.join(', ')} · {fmt(open.created_at)}</div>
                <a href={`mailto:${open.reply_to?.[0] ?? open.from}?subject=${encodeURIComponent('Re: ' + (open.subject ?? ''))}`} style={{ display: 'inline-block', marginBottom: '1rem', padding: '.5rem 1rem', borderRadius: 999, background: '#E67E22', color: 'white', fontWeight: 700, fontSize: '.82rem', textDecoration: 'none' }}>Responder</a>
                {open.html
                  ? <iframe sandbox="" srcDoc={open.html} style={{ width: '100%', minHeight: 500, border: '1px solid rgba(26,43,76,.08)', borderRadius: 10 }} />
                  : <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '.9rem' }}>{open.text}</pre>}
                {open.attachments?.length > 0 && <div style={{ fontSize: '.8rem', color: '#7A8699', marginTop: '.8rem' }}>📎 {open.attachments.length} adjunto(s): {open.attachments.map(a => a.filename).join(', ')} (descárgalos desde Resend → Emails → Receiving)</div>}
              </>
            ) : <div style={{ color: '#7A8699', fontSize: '.88rem' }}>Selecciona un correo.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
