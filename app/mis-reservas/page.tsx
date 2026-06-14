'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Booking = {
  id: number; bookingCode: string; posadaId: number
  posadaNombre: string; posadaSlug: string; posadaImg: string
  checkIn: string; checkOut: string; nights: number; totalPrice: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  paymentMethod: string | null; guestCount: number; notes: string | null
  hostNotes: string | null; createdAt: string
}

const STATUS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending:   { label: 'Pendiente de confirmación', color: '#92400e', bg: 'rgba(245,158,11,0.1)',  icon: '⏳' },
  confirmed: { label: 'Confirmada',                color: '#047857', bg: 'rgba(16,185,129,0.1)', icon: '✅' },
  cancelled: { label: 'Cancelada',                 color: '#b91c1c', bg: 'rgba(239,68,68,0.08)', icon: '❌' },
  completed: { label: 'Completada',                color: '#4338ca', bg: 'rgba(99,102,241,0.1)', icon: '⭐' },
}

const MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
function fmt(d: string) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day} ${MONTHS[+m-1]} ${y}`
}

export default function MisReservasPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [notLoggedIn, setNotLoggedIn] = useState(false)
  const [cancelling, setCancelling] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/bookings')
      .then(r => { if (r.status === 401) { setNotLoggedIn(true); return null }; return r.json() })
      .then(data => { if (data) setBookings(data) })
      .finally(() => setLoading(false))
  }, [])

  async function cancel(id: number) {
    if (!confirm('¿Cancelar esta reserva?')) return
    setCancelling(id)
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (res.ok) setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b))
    } finally {
      setCancelling(null)
    }
  }

  const active   = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed')
  const past     = bookings.filter(b => b.status === 'cancelled' || b.status === 'completed')

  return (
    <>
      <style>{`
        :root{--indigo:#1A2B4C;--cacao:#E67E22;--cacao-dark:#C96510;--sand:#FDFBF7;--muted:#7A8699;--line:rgba(26,43,76,0.08);}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Inter',sans-serif;background:var(--sand);color:var(--indigo);}
        .nav{background:white;border-bottom:1.5px solid var(--line);padding:0 2rem;height:64px;display:flex;align-items:center;justify-content:space-between;}
        .nav-logo{font-size:1.3rem;font-weight:800;letter-spacing:-0.04em;color:var(--indigo);text-decoration:none;}
        .nav-logo span{color:var(--cacao);}
        .main{max-width:860px;margin:0 auto;padding:2.5rem 1.5rem 5rem;}
        .page-title{font-size:1.8rem;font-weight:800;letter-spacing:-0.03em;margin-bottom:0.3rem;}
        .page-sub{font-size:0.88rem;color:var(--muted);margin-bottom:2rem;}
        .section-label{font-size:0.68rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--cacao);margin-bottom:0.85rem;margin-top:1.75rem;display:flex;align-items:center;gap:0.5rem;}
        .section-label::before{content:'';width:0.8rem;height:2px;background:var(--cacao);border-radius:2px;}
        .card{background:white;border:1.5px solid var(--line);border-radius:18px;padding:1.4rem 1.5rem;margin-bottom:0.85rem;box-shadow:0 4px 16px rgba(26,43,76,0.05);display:grid;grid-template-columns:80px 1fr;gap:1.25rem;align-items:start;transition:box-shadow 0.18s;}
        .card:hover{box-shadow:0 8px 28px rgba(26,43,76,0.09);}
        .card-img{width:80px;height:70px;border-radius:10px;object-fit:cover;background:rgba(26,43,76,0.06);}
        .card-img-ph{width:80px;height:70px;border-radius:10px;background:linear-gradient(135deg,rgba(26,43,76,0.07),rgba(230,126,34,0.08));display:flex;align-items:center;justify-content:center;font-size:1.6rem;}
        .card-body{min-width:0;}
        .card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:0.5rem;margin-bottom:0.3rem;}
        .card-nombre{font-size:0.98rem;font-weight:700;color:var(--indigo);}
        .badge{display:inline-flex;align-items:center;gap:0.3rem;padding:0.22rem 0.6rem;border-radius:99px;font-size:0.72rem;font-weight:700;flex-shrink:0;}
        .card-dates{font-size:0.83rem;color:var(--muted);margin-bottom:0.5rem;}
        .card-dates strong{color:var(--indigo);}
        .card-footer{display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-top:0.5rem;}
        .card-price{font-weight:800;font-size:1rem;color:var(--indigo);}
        .card-code{font-size:0.75rem;color:var(--muted);font-variant-numeric:tabular-nums;}
        .card-pay{font-size:0.78rem;color:var(--muted);}
        .card-actions{display:flex;align-items:center;gap:0.5rem;margin-top:0.6rem;flex-wrap:wrap;}
        .btn-view{font-size:0.8rem;font-weight:600;color:var(--cacao);text-decoration:none;padding:0.3rem 0;border-bottom:1px solid transparent;transition:border-color 0.18s;}
        .btn-view:hover{border-color:var(--cacao);}
        .btn-cancel{font-size:0.78rem;font-weight:600;color:#b91c1c;background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.2);border-radius:99px;padding:0.28rem 0.75rem;cursor:pointer;font-family:inherit;transition:all 0.18s;}
        .btn-cancel:hover:not(:disabled){background:rgba(239,68,68,0.13);}
        .btn-cancel:disabled{opacity:0.5;cursor:not-allowed;}
        .host-note{background:rgba(16,185,129,0.07);border-left:3px solid #10b981;border-radius:0 8px 8px 0;padding:0.6rem 0.85rem;font-size:0.8rem;color:#047857;margin-top:0.6rem;line-height:1.5;}
        .pay-instructions{background:rgba(230,126,34,0.06);border-left:3px solid var(--cacao);border-radius:0 8px 8px 0;padding:0.6rem 0.85rem;font-size:0.8rem;color:#92400e;margin-top:0.6rem;line-height:1.5;}
        .empty{text-align:center;padding:3.5rem 1rem;}
        .empty-icon{font-size:2.5rem;margin-bottom:0.75rem;}
        .empty-title{font-size:1rem;font-weight:700;margin-bottom:0.4rem;}
        .empty-sub{font-size:0.85rem;color:var(--muted);margin-bottom:1.25rem;}
        .btn-explore{display:inline-block;padding:0.75rem 1.5rem;background:var(--cacao);color:white;border-radius:12px;text-decoration:none;font-weight:700;font-size:0.88rem;transition:all 0.2s;}
        .btn-explore:hover{background:var(--cacao-dark);transform:translateY(-1px);}
        .loading{text-align:center;padding:3rem;color:var(--muted);font-size:0.9rem;}
      `}</style>

      <nav className="nav">
        <a href="/" className="nav-logo">RESER<span>-VE</span></a>
        <div style={{display:'flex',gap:'1.25rem',alignItems:'center'}}>
          <a href="/buscar" style={{fontSize:'0.84rem',fontWeight:600,color:'var(--muted)',textDecoration:'none'}}>Explorar</a>
          <a href="/api/auth/signout" style={{fontSize:'0.84rem',fontWeight:600,color:'var(--muted)',textDecoration:'none'}}>Salir</a>
        </div>
      </nav>

      <main className="main">
        <div className="page-title">Mis reservas</div>
        <div className="page-sub">Historial de tus estadías en posadas venezolanas</div>

        {loading && <div className="loading">Cargando tus reservas…</div>}

        {notLoggedIn && (
          <div className="empty">
            <div className="empty-icon">🔐</div>
            <div className="empty-title">Inicia sesión para ver tus reservas</div>
            <a href="/login?callbackUrl=/mis-reservas" className="btn-explore">Iniciar sesión</a>
          </div>
        )}

        {!loading && !notLoggedIn && bookings.length === 0 && (
          <div className="empty">
            <div className="empty-icon">🏖️</div>
            <div className="empty-title">Aún no tienes reservas</div>
            <div className="empty-sub">Explora posadas y planifica tu próxima aventura venezolana</div>
            <a href="/buscar" className="btn-explore">Explorar posadas</a>
          </div>
        )}

        {!loading && active.length > 0 && (
          <>
            <div className="section-label">Reservas activas ({active.length})</div>
            {active.map(b => <BookingCard key={b.id} b={b} onCancel={cancel} cancelling={cancelling === b.id} />)}
          </>
        )}

        {!loading && past.length > 0 && (
          <>
            <div className="section-label">Historial</div>
            {past.map(b => <BookingCard key={b.id} b={b} onCancel={cancel} cancelling={cancelling === b.id} />)}
          </>
        )}
      </main>
    </>
  )
}

function ReviewForm({ posadaId }: { posadaId: number }) {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)
  const [texto, setTexto] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!texto.trim()) return
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posadaId, rating, texto }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error || 'No se pudo enviar la reseña'); return }
      setDone(true)
    } catch { setError('Error de red. Intenta de nuevo.') }
    finally { setBusy(false) }
  }

  if (done) return <div className="host-note" style={{ marginTop: '0.6rem' }}>¡Gracias por tu reseña! ⭐</div>
  if (!open) {
    return (
      <button className="btn-cancel" style={{ color: 'var(--cacao)', background: 'rgba(230,126,34,0.08)', borderColor: 'rgba(230,126,34,0.25)' }} onClick={() => setOpen(true)}>
        ⭐ Dejar una reseña
      </button>
    )
  }
  return (
    <div style={{ marginTop: '0.6rem', background: 'rgba(26,43,76,0.03)', border: '1px solid var(--line)', borderRadius: 12, padding: '0.85rem 1rem' }}>
      <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.5rem' }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
            aria-label={`${n} estrellas`}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', padding: 0, color: (hover || rating) >= n ? '#E67E22' : 'rgba(26,43,76,0.2)' }}>★</button>
        ))}
      </div>
      <textarea value={texto} onChange={e => setTexto(e.target.value)} placeholder="¿Cómo fue tu experiencia?"
        style={{ width: '100%', minHeight: 70, border: '1.5px solid var(--line)', borderRadius: 10, padding: '0.6rem 0.8rem', fontFamily: 'inherit', fontSize: '0.85rem', resize: 'vertical', outline: 'none' }} />
      {error && <div style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '0.4rem' }}>{error}</div>}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
        <button className="btn-explore" style={{ padding: '0.5rem 1.1rem', fontSize: '0.82rem' }} disabled={busy || !texto.trim()} onClick={submit}>
          {busy ? 'Enviando…' : 'Publicar reseña'}
        </button>
        <button className="btn-cancel" onClick={() => setOpen(false)}>Cancelar</button>
      </div>
    </div>
  )
}

function BookingCard({ b, onCancel, cancelling }: { b: Booking; onCancel: (id: number) => void; cancelling: boolean }) {
  const s = STATUS[b.status] ?? STATUS.pending
  const canCancel = b.status === 'pending'

  const payInstructions: Record<string, string> = {
    Zelle: `Transfiere $${b.totalPrice} USD a zelle@reser-ve.com. Concepto: ${b.bookingCode}`,
    Zinli: `Envía $${b.totalPrice} USD a @reserveve en Zinli. Mensaje: ${b.bookingCode}`,
    'Pago Móvil': `Pago Móvil al 0412-5550000. Monto equivalente a $${b.totalPrice} USD. Concepto: ${b.bookingCode}`,
  }
  const instruction = payInstructions[b.paymentMethod ?? '']

  return (
    <div className="card">
      {b.posadaImg
        ? <img src={b.posadaImg} alt={b.posadaNombre} className="card-img" />
        : <div className="card-img-ph">🏡</div>
      }
      <div className="card-body">
        <div className="card-top">
          <div className="card-nombre">{b.posadaNombre}</div>
          <span className="badge" style={{background: s.bg, color: s.color}}>{s.icon} {s.label}</span>
        </div>
        <div className="card-dates">
          <strong>{fmt(b.checkIn)}</strong> → <strong>{fmt(b.checkOut)}</strong>
          &nbsp;·&nbsp;{b.nights} noche{b.nights > 1 ? 's' : ''}&nbsp;·&nbsp;{b.guestCount} huésped{b.guestCount > 1 ? 'es' : ''}
        </div>
        <div className="card-footer">
          <span className="card-price">${b.totalPrice} USD</span>
          <span className="card-code">{b.bookingCode}</span>
          {b.paymentMethod && <span className="card-pay">· {b.paymentMethod}</span>}
        </div>

        {b.status === 'confirmed' && instruction && (
          <div className="pay-instructions">
            <strong>Instrucciones de pago:</strong> {instruction}
          </div>
        )}
        {b.hostNotes && b.status === 'confirmed' && (
          <div className="host-note"><strong>Mensaje del posadero:</strong> {b.hostNotes}</div>
        )}

        <div className="card-actions">
          {b.posadaSlug && (
            <Link href={`/posadas/${b.posadaSlug}`} className="btn-view">Ver posada →</Link>
          )}
          {canCancel && (
            <button className="btn-cancel" disabled={cancelling} onClick={() => onCancel(b.id)}>
              {cancelling ? 'Cancelando…' : 'Cancelar solicitud'}
            </button>
          )}
          {(b.status === 'completed' || b.status === 'confirmed') && <ReviewForm posadaId={b.posadaId} />}
        </div>
      </div>
    </div>
  )
}
