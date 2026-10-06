'use client'

import { useState, useEffect, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import DashboardNav from '@/components/DashboardNav'
import { hostNet } from '@/lib/constants'

type Booking = {
  id: number
  posadaId: number
  guestId: number
  bookingCode: string | null
  posadaNombre: string
  posadaSlug: string
  posadaImg: string | null
  guestName: string
  guestEmail: string
  checkIn: string
  checkOut: string
  nights: number
  totalPrice: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  paymentMethod: string | null
  guestCount: number
  notes: string | null
  hostNotes: string | null
  createdAt: string
}

const statusColor: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#10b981',
  cancelled: '#ef4444',
  completed: '#6366f1',
}
const statusLabel: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
}

type FilterTab = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'

export default function ReservasPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [updating, setUpdating] = useState<number | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [hostNoteInput, setHostNoteInput] = useState<Record<number, string>>({})

  const router = useRouter()
  const [loadError, setLoadError] = useState(false)
  const [openingChat, setOpeningChat] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/bookings')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => { setBookings(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => { setLoadError(true); setLoading(false) })
  }, [])

  // Abre (o crea) el chat con el huésped de esta reserva.
  async function openChat(id: number) {
    setOpeningChat(id)
    const res = await fetch(`/api/bookings/${id}/chat`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    setOpeningChat(null)
    if (res.ok && data.id) router.push(`/mensajes/${data.id}`)
    else alert(data.error ?? 'No se pudo abrir el chat')
  }

  async function updateStatus(id: number, status: string, hostNotes?: string) {
    if (status === 'cancelled') {
      const b = bookings.find(x => x.id === id)
      const msg = b?.status === 'confirmed'
        ? '¿Cancelar esta reserva confirmada? El viajero recibirá un correo. Si ya pagó, coordina el reembolso por el chat.'
        : '¿Rechazar esta solicitud? El viajero recibirá un correo.'
      if (!confirm(msg)) return
    }
    setUpdating(id)
    const body: Record<string, string> = { status }
    if (hostNotes) body.hostNotes = hostNotes
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const updated = await res.json()
      setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b))
      setExpanded(null)
    } else {
      alert((await res.json().catch(() => ({}))).error ?? 'No se pudo actualizar la reserva')
    }
    setUpdating(null)
  }

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

  return (
    <>
      <style>{`
        :root{--indigo:#1A2B4C;--cacao:#E67E22;--cacao-dark:#C96510;--sand:#FDFBF7;--muted:#7A8699;--line:rgba(26,43,76,0.08);}
        *,*::before,*::after{box-sizing:border-box;}
        body{font-family:'Inter',sans-serif;background:var(--sand);color:var(--indigo);margin:0;}
        .nav{background:white;border-bottom:1.5px solid var(--line);padding:0 2rem;height:64px;display:flex;align-items:center;justify-content:space-between;}
        .nav-logo{font-size:1.3rem;font-weight:800;letter-spacing:-0.04em;color:var(--indigo);text-decoration:none;}
        .nav-logo span{color:var(--cacao);}
        .nav-links{display:flex;align-items:center;gap:1.5rem;}
        .nav-link{font-size:0.84rem;font-weight:600;color:var(--muted);text-decoration:none;transition:color 0.18s;}
        .nav-link:hover{color:var(--indigo);}
        .main{max-width:1100px;margin:0 auto;padding:2.5rem 1.5rem;}
        .page-title{font-family:'Playfair Display',Georgia,serif;font-size:1.8rem;font-weight:700;margin-bottom:0.4rem;}
        .page-sub{font-size:0.9rem;color:var(--muted);margin-bottom:2rem;}
        .tabs{display:flex;gap:0.5rem;margin-bottom:1.5rem;border-bottom:1.5px solid var(--line);padding-bottom:0;}
        .tab{padding:0.6rem 1.1rem;font-size:0.85rem;font-weight:600;font-family:inherit;background:none;border:none;border-bottom:2.5px solid transparent;cursor:pointer;color:var(--muted);transition:all 0.15s;margin-bottom:-1.5px;}
        .tab.active{color:var(--cacao);border-bottom-color:var(--cacao);}
        .tab:hover:not(.active){color:var(--indigo);}
        .table-wrap{background:white;border:1.5px solid var(--line);border-radius:17px;overflow:hidden;box-shadow:0 8px 32px rgba(26,43,76,0.06);}
        .t-head{display:grid;grid-template-columns:1fr 1.4fr 1fr 110px 130px;padding:0.8rem 1.4rem;background:rgba(26,43,76,0.03);font-size:0.72rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--muted);border-bottom:1.5px solid var(--line);}
        .t-row{display:grid;grid-template-columns:1fr 1.4fr 1fr 110px 130px;padding:1rem 1.4rem;border-bottom:1px solid var(--line);font-size:0.85rem;align-items:start;transition:background 0.15s;cursor:pointer;}
        .t-row:last-child{border-bottom:none;}
        .t-row:hover{background:rgba(26,43,76,0.015);}
        .badge{display:inline-flex;align-items:center;padding:0.25rem 0.65rem;border-radius:99px;font-size:0.72rem;font-weight:700;}
        .actions{display:flex;gap:0.4rem;flex-wrap:wrap;}
        .act-btn{padding:0.35rem 0.7rem;border-radius:8px;font-size:0.76rem;font-weight:700;font-family:inherit;border:none;cursor:pointer;transition:all 0.15s;}
        .act-btn:disabled{opacity:0.5;cursor:not-allowed;}
        .act-confirm{background:rgba(16,185,129,0.1);color:#10b981;}
        .act-confirm:hover:not(:disabled){background:rgba(16,185,129,0.2);}
        .act-cancel{background:rgba(239,68,68,0.08);color:#ef4444;}
        .act-cancel:hover:not(:disabled){background:rgba(239,68,68,0.16);}
        .act-expand{background:rgba(26,43,76,0.06);color:var(--indigo);}
        .act-expand:hover:not(:disabled){background:rgba(26,43,76,0.11);}
        .empty{text-align:center;padding:3rem;color:var(--muted);font-size:0.9rem;}
        .loading{text-align:center;padding:3rem;color:var(--muted);}
        .expand-panel{padding:1rem 1.4rem 1.2rem;background:rgba(26,43,76,0.018);border-bottom:1px solid var(--line);}
        .expand-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:0.8rem;margin-bottom:1rem;}
        .expand-field label{font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--muted);display:block;margin-bottom:0.2rem;}
        .expand-field span{font-size:0.85rem;color:var(--indigo);}
        .note-textarea{width:100%;padding:0.55rem 0.8rem;border:1.5px solid var(--line);border-radius:10px;font-family:inherit;font-size:0.84rem;color:var(--indigo);background:white;resize:vertical;min-height:72px;outline:none;transition:border 0.15s;}
        .note-textarea:focus{border-color:var(--cacao);}
        .code-chip{display:inline-block;font-size:0.72rem;font-weight:700;font-family:monospace;background:rgba(26,43,76,0.07);color:var(--indigo);padding:0.15rem 0.5rem;border-radius:6px;letter-spacing:0.04em;}
        @media(max-width:700px){
          .t-head,.t-row{grid-template-columns:1fr 100px 120px;}
          .t-head>*:nth-child(2),.t-row>*:nth-child(2),
          .t-head>*:nth-child(3),.t-row>*:nth-child(3){display:none;}
        }
      `}</style>

      <DashboardNav />

      <main className="main">
        <div className="page-title">Gestión de reservas</div>
        <div className="page-sub">Confirma, cancela o revisa todas las reservas de tus posadas</div>

        <div className="tabs">
          {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as FilterTab[]).map(t => (
            <button key={t} className={`tab${filter === t ? ' active' : ''}`} onClick={() => setFilter(t)}>
              {t === 'all' ? 'Todas' : t === 'pending' ? 'Pendientes' : t === 'confirmed' ? 'Confirmadas' : t === 'completed' ? 'Completadas' : 'Canceladas'}
              <span style={{marginLeft:'0.4rem',fontSize:'0.7rem',fontWeight:600,color:'inherit',opacity:0.7}}>
                ({t === 'all' ? bookings.length : bookings.filter(b => b.status === t).length})
              </span>
            </button>
          ))}
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="loading">Cargando reservas…</div>
          ) : loadError ? (
            <div className="empty">No pudimos cargar tus reservas. Recarga la página.</div>
          ) : filtered.length === 0 ? (
            <div className="empty">No hay reservas en esta categoría.</div>
          ) : (
            <>
              <div className="t-head">
                <span>Huésped</span>
                <span>Posada</span>
                <span>Fechas</span>
                <span>Estado</span>
                <span>Acciones</span>
              </div>
              {filtered.map(b => (
                <Fragment key={b.id}>
                  <div className="t-row" onClick={() => setExpanded(expanded === b.id ? null : b.id)}>
                    <div>
                      <div style={{fontWeight:600}}>{b.guestName || `Huésped #${b.guestId}`}</div>
                      {b.bookingCode && <span className="code-chip" style={{marginTop:3,display:'inline-block'}}>{b.bookingCode}</span>}
                    </div>
                    <div>
                      <div style={{fontWeight:500}}>{b.posadaNombre || `Posada #${b.posadaId}`}</div>
                      <div style={{fontSize:'0.76rem',color:'var(--muted)'}}>{b.guestCount} pers.</div>
                    </div>
                    <div>
                      <div style={{fontSize:'0.84rem'}}>{b.checkIn}</div>
                      <div style={{fontSize:'0.78rem',color:'var(--muted)'}}>→ {b.checkOut} · {b.nights}n</div>
                      <div style={{fontWeight:700,marginTop:2}}>${hostNet(b.totalPrice)}</div>
                    </div>
                    <span>
                      <span className="badge" style={{background:`${statusColor[b.status]}18`,color:statusColor[b.status]}}>
                        {statusLabel[b.status]}
                      </span>
                    </span>
                    <div className="actions" onClick={e => e.stopPropagation()}>
                      {b.status === 'pending' && (
                        <>
                          <button className="act-btn act-expand" onClick={() => setExpanded(expanded === b.id ? null : b.id)}>
                            {expanded === b.id ? 'Cerrar' : 'Revisar'}
                          </button>
                          <button className="act-btn act-cancel" disabled={updating === b.id} onClick={() => updateStatus(b.id, 'cancelled')}>
                            Rechazar
                          </button>
                        </>
                      )}
                      {(b.status === 'pending' || b.status === 'confirmed' || b.status === 'completed') && (
                        <button className="act-btn act-expand" disabled={openingChat === b.id} onClick={() => openChat(b.id)}>
                          Chat
                        </button>
                      )}
                      {b.status === 'confirmed' && (
                        <button className="act-btn act-cancel" disabled={updating === b.id} onClick={() => updateStatus(b.id, 'cancelled')}>
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>

                  {expanded === b.id && (
                    <div key={`exp-${b.id}`} className="expand-panel">
                      <div className="expand-grid">
                        <div className="expand-field">
                          <label>Huésped</label>
                          <span>{b.guestName}</span>
                        </div>
                        <div className="expand-field">
                          <label>Código</label>
                          <span className="code-chip">{b.bookingCode ?? '—'}</span>
                        </div>
                        <div className="expand-field">
                          <label>Check-in</label>
                          <span>{b.checkIn}</span>
                        </div>
                        <div className="expand-field">
                          <label>Check-out</label>
                          <span>{b.checkOut}</span>
                        </div>
                        <div className="expand-field">
                          <label>Noches</label>
                          <span>{b.nights}</span>
                        </div>
                        <div className="expand-field">
                          <label>Huéspedes</label>
                          <span>{b.guestCount} personas</span>
                        </div>
                        <div className="expand-field">
                          <label>Tu ingreso</label>
                          <span style={{fontWeight:700}}>${hostNet(b.totalPrice)}</span>
                        </div>
                        <div className="expand-field">
                          <label>Precio que paga el huésped</label>
                          <span>${b.totalPrice}</span>
                        </div>
                        {b.paymentMethod && (
                          <div className="expand-field">
                            <label>Pago</label>
                            <span>{b.paymentMethod}</span>
                          </div>
                        )}
                      </div>
                      {b.notes && (
                        <div style={{marginBottom:'1rem'}}>
                          <div style={{fontSize:'0.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--muted)',marginBottom:'0.3rem'}}>Notas del huésped</div>
                          <div style={{fontSize:'0.84rem',background:'white',padding:'0.6rem 0.8rem',borderRadius:10,border:'1.5px solid var(--line)'}}>{b.notes}</div>
                        </div>
                      )}
                      {b.status === 'pending' && (
                        <div>
                          <div style={{fontSize:'0.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--muted)',marginBottom:'0.4rem'}}>
                            Mensaje al huésped (opcional)
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#92400e', background: 'rgba(245,158,11,0.08)', borderRadius: 8, padding: '0.5rem 0.7rem', marginBottom: '0.5rem' }}>Antes de confirmar, revisa que tengas la habitación libre esas fechas (en tu cuaderno, WhatsApp o tu <a href="/dashboard/calendario" style={{ color: 'inherit', fontWeight: 700 }}>calendario</a>).</div>
                          <textarea
                            className="note-textarea"
                            placeholder="Mensaje de bienvenida o instrucciones de llegada. Los datos de pago envíalos por el chat de RESER-VE."
                            value={hostNoteInput[b.id] ?? ''}
                            onChange={e => setHostNoteInput(prev => ({ ...prev, [b.id]: e.target.value }))}
                          />
                          <div style={{display:'flex',gap:'0.6rem',marginTop:'0.8rem'}}>
                            <button
                              className="act-btn act-confirm"
                              style={{padding:'0.5rem 1.2rem',fontSize:'0.82rem'}}
                              disabled={updating === b.id}
                              onClick={() => updateStatus(b.id, 'confirmed', hostNoteInput[b.id])}
                            >
                              {updating === b.id ? 'Confirmando…' : 'Confirmar reserva'}
                            </button>
                            <button
                              className="act-btn act-cancel"
                              style={{padding:'0.5rem 1.2rem',fontSize:'0.82rem'}}
                              disabled={updating === b.id}
                              onClick={() => updateStatus(b.id, 'cancelled', hostNoteInput[b.id])}
                            >
                              Rechazar
                            </button>
                          </div>
                        </div>
                      )}
                      {b.hostNotes && b.status !== 'pending' && (
                        <div>
                          <div style={{fontSize:'0.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--muted)',marginBottom:'0.3rem'}}>Tu mensaje al huésped</div>
                          <div style={{fontSize:'0.84rem',background:'white',padding:'0.6rem 0.8rem',borderRadius:10,border:'1.5px solid var(--line)'}}>{b.hostNotes}</div>
                        </div>
                      )}
                    </div>
                  )}
                </Fragment>
              ))}
            </>
          )}
        </div>
      </main>
    </>
  )
}
