import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Resend } from 'resend'
import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'

// Bandeja de correo del equipo:
//  · Recibidos: lo que llega a hola@reser-ve.com (Resend Receiving).
//  · Avisos al equipo: lo que la plataforma envía a los admins (posadas por revisar, tickets…).
//  · Enviados: todos los correos que envía la plataforma, con su estado de entrega.
type Tab = 'recibidos' | 'avisos' | 'enviados'

const STATUS: Record<string, { l: string; c: string }> = {
  delivered: { l: 'Entregado', c: '#067647' }, sent: { l: 'Enviado', c: '#5B6B82' }, opened: { l: 'Abierto', c: '#067647' },
  bounced: { l: 'Rebotó', c: '#B42318' }, complained: { l: 'Marcado como spam', c: '#B42318' }, delivery_delayed: { l: 'Retrasado', c: '#B54708' },
  failed: { l: 'Falló', c: '#B42318' }, queued: { l: 'En cola', c: '#5B6B82' },
}

export default async function CorreoPage({ searchParams }: { searchParams: Promise<{ id?: string; tab?: string }> }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') redirect('/login?callbackUrl=/admin/correo')
  const sp = await searchParams
  const tab: Tab = sp.tab === 'avisos' || sp.tab === 'enviados' ? sp.tab : 'recibidos'
  const id = sp.id && /^[0-9a-f-]{36}$/i.test(sp.id) ? sp.id : undefined
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

  const admins = (await getDb().select({ email: users.email }).from(users).where(eq(users.role, 'admin'))).map(a => a.email.toLowerCase())

  type Row = { id: string; from: string; to: string[]; subject: string; created_at: string; status?: string }
  let list: Row[] = []
  let open: { subject: string; from: string; to: string[]; created_at: string; html: string | null; text: string | null; replyTo?: string; attachments?: number; status?: string } | null = null

  if (resend) {
    if (tab === 'recibidos') {
      list = await resend.emails.receiving.list({ limit: 100 }).then(r => (r.data?.data ?? []) as Row[]).catch(() => [])
      if (id) open = await resend.emails.receiving.get(id).then(r => r.data ? { ...r.data, replyTo: r.data.reply_to?.[0] ?? r.data.from, attachments: r.data.attachments?.length ?? 0 } : null).catch(() => null)
    } else {
      const sent = await resend.emails.list({ limit: 100 }).then(r => (r.data?.data ?? []) as any[]).catch(() => [])
      list = sent
        .filter(e => tab === 'enviados' || e.to.some((t: string) => admins.includes(t.toLowerCase())))
        .map(e => ({ id: e.id, from: e.from, to: e.to, subject: e.subject, created_at: e.created_at, status: e.last_event }))
      if (id) open = await resend.emails.get(id).then(r => r.data ? { subject: r.data.subject, from: r.data.from, to: r.data.to as string[], created_at: r.data.created_at, html: r.data.html ?? null, text: r.data.text ?? null, status: (r.data as any).last_event } : null).catch(() => null)
    }
  }

  const fmt = (d: string) => new Date(d).toLocaleString('es-VE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Caracas' })
  // Sin scripts ni imágenes remotas dentro del correo (evita píxeles de rastreo).
  const CSP = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: cid:; style-src 'unsafe-inline'">`
  const tabLink = (t: Tab, label: string) => (
    <Link href={`/admin/correo?tab=${t}`} style={{ padding: '.5rem .9rem', borderRadius: 999, textDecoration: 'none', fontSize: '.84rem', fontWeight: 700, background: tab === t ? '#1A2B4C' : 'white', color: tab === t ? 'white' : '#1A2B4C', border: '1.5px solid rgba(26,43,76,.12)' }}>{label}</Link>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FDFBF7', fontFamily: "'Inter',system-ui,sans-serif", color: '#1A2B4C' }}>
      <div style={{ maxWidth: 1150, margin: '0 auto', padding: '2rem 1.25rem' }}>
        <Link href="/admin" style={{ color: '#7A8699', textDecoration: 'none', fontSize: '.85rem' }}>← Volver al panel</Link>
        <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: '1.8rem', margin: '.6rem 0 .2rem' }}>Correo</h1>
        <p style={{ color: '#7A8699', fontSize: '.88rem', margin: '0 0 1rem', lineHeight: 1.55 }}>
          <b>Recibidos</b>: lo que la gente escribe a hola@reser-ve.com (también llega reenviado a tu Gmail). <b>Avisos al equipo</b>: los correos automáticos que la web manda a los admins. <b>Enviados</b>: todo lo que envía la plataforma, con su estado de entrega.
        </p>
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {tabLink('recibidos', 'Recibidos en hola@')}
          {tabLink('avisos', 'Avisos al equipo')}
          {tabLink('enviados', 'Todos los enviados')}
        </div>
        {!resend && <p>Falta RESEND_API_KEY.</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 400px) 1fr', gap: '1rem', alignItems: 'start' }}>
          <div style={{ background: 'white', border: '1px solid rgba(26,43,76,.1)', borderRadius: 14, overflow: 'hidden', maxHeight: '75vh', overflowY: 'auto' }}>
            {list.length === 0 && <div style={{ padding: '1.2rem', color: '#7A8699', fontSize: '.88rem' }}>{tab === 'recibidos' ? 'Todavía no ha llegado ningún correo a hola@.' : 'No hay correos.'}</div>}
            {list.map(m => {
              const st = m.status ? STATUS[m.status] ?? { l: m.status, c: '#5B6B82' } : null
              return (
                <Link key={m.id} href={`/admin/correo?tab=${tab}&id=${m.id}`} style={{ display: 'block', padding: '.75rem 1rem', borderBottom: '1px solid rgba(26,43,76,.07)', textDecoration: 'none', color: 'inherit', background: m.id === id ? 'rgba(230,126,34,.08)' : 'white' }}>
                  <div style={{ fontSize: '.75rem', color: '#7A8699', display: 'flex', justifyContent: 'space-between', gap: '.5rem' }}>
                    <span>{tab === 'recibidos' ? m.from : `Para ${m.to.join(', ')}`}</span><span style={{ whiteSpace: 'nowrap' }}>{fmt(m.created_at)}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '.88rem', marginTop: 2 }}>{m.subject || '(sin asunto)'}</div>
                  {st && <div style={{ fontSize: '.72rem', fontWeight: 700, color: st.c, marginTop: 2 }}>{st.l}</div>}
                </Link>
              )
            })}
          </div>
          <div style={{ background: 'white', border: '1px solid rgba(26,43,76,.1)', borderRadius: 14, padding: '1.2rem', minHeight: 300 }}>
            {open ? (
              <>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{open.subject || '(sin asunto)'}</div>
                <div style={{ fontSize: '.82rem', color: '#7A8699', margin: '.3rem 0 1rem' }}>De <b>{open.from}</b> · para {open.to.join(', ')} · {fmt(open.created_at)}</div>
                {tab === 'recibidos' && open.replyTo && (
                  <a href={`mailto:${open.replyTo}?subject=${encodeURIComponent('Re: ' + (open.subject ?? ''))}`} style={{ display: 'inline-block', marginBottom: '1rem', padding: '.5rem 1rem', borderRadius: 999, background: '#E67E22', color: 'white', fontWeight: 700, fontSize: '.82rem', textDecoration: 'none' }}>Responder</a>
                )}
                {open.html
                  ? <iframe sandbox="" srcDoc={CSP + open.html} style={{ width: '100%', minHeight: 520, border: '1px solid rgba(26,43,76,.08)', borderRadius: 10 }} />
                  : <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '.9rem' }}>{open.text}</pre>}
                {!!open.attachments && <div style={{ fontSize: '.8rem', color: '#7A8699', marginTop: '.8rem' }}>Adjuntos: {open.attachments} (descárgalos desde Resend → Emails → Receiving)</div>}
              </>
            ) : <div style={{ color: '#7A8699', fontSize: '.88rem' }}>Selecciona un correo.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
