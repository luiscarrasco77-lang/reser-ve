'use client'

import { useState, useEffect } from 'react'

type Booking = {
  id: number
  posadaId: number
  checkIn: string
  checkOut: string
  nights: number
  totalPrice: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  paymentMethod: string | null
  guestCount: number
  notes: string | null
  createdAt: string
}

const statusColor: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#10b981',
  cancelled: '#ef4444',
  completed: '#6366f1',
}
const statusLabel: Record<string, string> = {
  pending: 'Pendiente de confirmación',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
}
const statusIcon: Record<string, string> = {
  pending: '⏳',
  confirmed: '✅',
  cancelled: '❌',
  completed: '⭐',
}

export default function MisReservasPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [notLoggedIn, setNotLoggedIn] = useState(false)

  useEffect(() => {
    fetch('/api/bookings')
      .then(r => {
        if (r.status === 401) { setNotLoggedIn(true); return null }
        return r.json()
      })
      .then(data => { if (data) setBookings(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <>
      <style>{`
        :root{--indigo:#1A2B4C;--cacao:#E67E22;--cacao-dark:#C96510;--sand:#FDFBF7;--muted:#7A8699;--line:rgba(26,43,76,0.08);}
        *,*::before,*::after{box-sizing:border-box;}
        body{font-family:'Inter',sans-serif;background:var(--sand);color:var(--indigo);margin:0;}
        .nav{background:white;border-bottom:1.5px solid var(--line);padding:0 2rem;height:64px;display:flex;align-items:center;justify-content:space-between;}
        .nav-logo{font-size:1.3rem;font-weight:800;letter-spacing:-0.04em;color:var(--indigo);text-decoration:none;}
        .nav-logo span{color:var(--cacao);}
        .main{max-width:900px;margin:0 auto;padding:2.5rem 1.5rem;}
        .page-title{font-family:'Playfair Display',Georgia,serif;font-size:1.8rem;font-weight:700;margin-bottom:0.4rem;}
        .page-sub{font-size:0.9rem;color:var(--muted);margin-bottom:2rem;}
        .booking-card{background:white;border:1.5px solid var(--line);border-radius:17px;padding:1.4rem 1.6rem;margin-bottom:1rem;box-shadow:0 4px 16px rgba(26,43,76,0.06);display:flex;gap:1.4rem;align-items:flex-start;transition:box-shadow 0.2s;}
        .booking-card:hover{box-shadow:0 8px 32px rgba(26,43,76,0.10);}
        .booking-img{width:90px;height:90px;border-radius:12px;object-fit:cover;flex-shrink:0;background:rgba(26,43,76,0.06);}
        .booking-img-placeholder{width:90px;height:90px;border-radius:12px;background:linear-gradient(135deg,rgba(26,43,76,0.08),rgba(230,126,34,0.1));flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:2rem;}
        .booking-info{flex:1;}
        .booking-posada{font-weight:700;font-size:1rem;margin-bottom:0.2rem;}
        .booking-dates{font-size:0.85rem;color:var(--muted);margin-bottom:0.5rem;}
        .booking-meta{display:flex;align-items:center;gap:1rem;flex-wrap:wrap;}
        .booking-price{font-weight:800;font-size:1rem;color:var(--indigo);}
        .booking-nights{font-size:0.8rem;color:var(--muted);}
        .badge{display:inline-flex;align-items:center;gap:0.3rem;padding:0.28rem 0.7rem;border-radius:99px;font-size:0.73rem;font-weight:700;}
        .booking-action{display:inline-flex;align-items:center;font-size:0.83rem;color:var(--cacao);font-weight:600;text-decoration:none;margin-top:0.6rem;}
        .booking-action:hover{text-decoration:underline;}
        .empty{text-align:center;padding:4rem 1rem;}
        .empty-icon{font-size:3rem;margin-bottom:1rem;}
        .empty-title{font-size:1.1rem;font-weight:700;margin-bottom:0.5rem;}
        .empty-sub{font-size:0.88rem;color:var(--muted);margin-bottom:1.5rem;}
        .btn-explore{display:inline-block;padding:0.8rem 1.6rem;background:var(--cacao);color:white;border-radius:12px;text-decoration:none;font-weight:700;font-size:0.88rem;transition:all 0.2s;}
        .btn-explore:hover{background:var(--cacao-dark);transform:translateY(-1px);}
        .loading{text-align:center;padding:3rem;color:var(--muted);}
        .auth-prompt{text-align:center;padding:3rem;}
        .auth-prompt p{font-size:0.95rem;color:var(--muted);margin-bottom:1.2rem;}
      `}</style>

      <nav className="nav">
        <a href="/" className="nav-logo">RESER<span>-VE</span></a>
        <div style={{display:'flex',gap:'1.5rem',alignItems:'center'}}>
          <a href="/buscar" style={{fontSize:'0.84rem',fontWeight:600,color:'var(--muted)',textDecoration:'none'}}>Explorar posadas</a>
          <a href="/api/auth/signout" style={{fontSize:'0.84rem',fontWeight:600,color:'var(--muted)',textDecoration:'none'}}>Cerrar sesión</a>
        </div>
      </nav>

      <main className="main">
        <div className="page-title">Mis reservas</div>
        <div className="page-sub">Aquí están todas tus reservas de posadas</div>

        {loading && <div className="loading">Cargando tus reservas…</div>}

        {notLoggedIn && (
          <div className="auth-prompt">
            <p>Inicia sesión para ver tus reservas</p>
            <a href="/login?callbackUrl=/mis-reservas" className="btn-explore">Iniciar sesión</a>
          </div>
        )}

        {!loading && !notLoggedIn && bookings.length === 0 && (
          <div className="empty">
            <div className="empty-icon">🏖️</div>
            <div className="empty-title">Aún no tienes reservas</div>
            <div className="empty-sub">Explora nuestras posadas y planifica tu próxima aventura venezolana</div>
            <a href="/buscar" className="btn-explore">Explorar posadas</a>
          </div>
        )}

        {!loading && bookings.map(b => (
          <div key={b.id} className="booking-card">
            <div className="booking-img-placeholder">🏡</div>
            <div className="booking-info">
              <div className="booking-posada">Posada #{b.posadaId}</div>
              <div className="booking-dates">
                {b.checkIn} → {b.checkOut} · {b.nights} {b.nights === 1 ? 'noche' : 'noches'} · {b.guestCount} {b.guestCount === 1 ? 'persona' : 'personas'}
              </div>
              <div className="booking-meta">
                <span className="booking-price">${b.totalPrice} USD</span>
                {b.paymentMethod && <span className="booking-nights">{b.paymentMethod}</span>}
                <span className="badge" style={{background:`${statusColor[b.status]}18`,color:statusColor[b.status]}}>
                  {statusIcon[b.status]} {statusLabel[b.status]}
                </span>
              </div>
              <a href={`/posadas/p-${b.posadaId}`} className="booking-action">
                Ver posada →
              </a>
            </div>
          </div>
        ))}
      </main>
    </>
  )
}
