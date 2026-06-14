'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────
type Stats = { totalUsers: number; totalPosadas: number; totalBookings: number; pendingReview: number; pendingBookings: number; revenue: number }
type Posada = { id: number; slug: string; nombre: string; destino: string; tipo: string; precio: number; status: string; hostName: string; hostEmail: string; createdAt: string; reviewNotes: string | null; imgs: string[] }
type Booking = { id: number; bookingCode: string; posadaNombre: string; posadaSlug: string; guestName: string; guestEmail: string; checkIn: string; checkOut: string; nights: number; totalPrice: number; status: string; paymentMethod: string | null; createdAt: string }
type User = { id: number; name: string; email: string; role: string; country: string | null; createdAt: string }

// ─── Helpers ─────────────────────────────────────────────────────────────────
const POSADA_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  draft:          { label: 'Borrador',    color: '#7A8699', bg: 'rgba(122,134,153,0.1)' },
  pending_review: { label: 'En revisión', color: '#92400e', bg: 'rgba(245,158,11,0.12)' },
  active:         { label: 'Activa',      color: '#047857', bg: 'rgba(16,185,129,0.1)'  },
  suspended:      { label: 'Suspendida',  color: '#b91c1c', bg: 'rgba(239,68,68,0.08)'  },
  rejected:       { label: 'Rechazada',   color: '#b91c1c', bg: 'rgba(239,68,68,0.08)'  },
}
const BOOKING_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pendiente',  color: '#92400e', bg: 'rgba(245,158,11,0.12)' },
  confirmed: { label: 'Confirmada', color: '#047857', bg: 'rgba(16,185,129,0.1)'  },
  cancelled: { label: 'Cancelada',  color: '#b91c1c', bg: 'rgba(239,68,68,0.08)'  },
  completed: { label: 'Completada', color: '#4338ca', bg: 'rgba(99,102,241,0.1)'  },
}
const ROLES: Record<string, { label: string; color: string }> = {
  traveler: { label: 'Viajero',  color: '#1A2B4C' },
  host:     { label: 'Posadero', color: '#E67E22' },
  admin:    { label: 'Admin',    color: '#dc2626'  },
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' })
}
function Badge({ status, map }: { status: string; map: Record<string, { label: string; color: string; bg: string }> }) {
  const s = map[status] ?? { label: status, color: '#7A8699', bg: 'rgba(122,134,153,0.1)' }
  return <span style={{ display:'inline-block', padding:'0.2rem 0.6rem', borderRadius:'99px', fontSize:'0.7rem', fontWeight:700, background:s.bg, color:s.color }}>{s.label}</span>
}

type Tab = 'overview' | 'review' | 'posadas' | 'bookings' | 'users'

export default function AdminDashboard({ adminName, adminEmail }: { adminName: string; adminEmail: string }) {
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [posadas, setPosadas] = useState<Posada[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  // Review state
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({})
  const [reviewLoading, setReviewLoading] = useState<number | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

  // Filters
  const [posadaFilter, setPosadaFilter] = useState('all')
  const [bookingFilter, setBookingFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('all')
  const [search, setSearch] = useState('')

  const fetchStats = useCallback(() =>
    fetch('/api/admin/stats').then(r => r.json()).then(setStats).catch(() => {}), [])

  const fetchData = useCallback((t: Tab) => {
    setLoading(true)
    const endpoints: Record<string, string> = { posadas: '/api/admin/posadas', bookings: '/api/admin/bookings', users: '/api/admin/users', review: '/api/admin/posadas' }
    const ep = endpoints[t]
    if (!ep) { setLoading(false); return }
    fetch(ep).then(r => r.json()).then(data => {
      if (t === 'posadas' || t === 'review') setPosadas(data)
      if (t === 'bookings') setBookings(data)
      if (t === 'users') setUsers(data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { fetchData(tab) }, [tab, fetchData])

  async function reviewPosada(id: number, action: 'approve' | 'reject') {
    const notes = reviewNotes[id] ?? ''
    if (action === 'reject' && !notes.trim()) { alert('Escribe una nota para rechazar.'); return }
    setReviewLoading(id)
    await fetch(`/api/admin/posadas/${id}/review`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, notes }),
    })
    setPosadas(prev => prev.map(p => p.id === id ? { ...p, status: action === 'approve' ? 'active' : 'rejected' } : p))
    setExpanded(null)
    fetchStats()
    setReviewLoading(null)
  }

  async function suspendPosada(id: number, suspend: boolean) {
    await fetch(`/api/admin/posadas/${id}/review`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: suspend ? 'reject' : 'approve', notes: suspend ? 'Suspendida por el administrador.' : '' }),
    })
    setPosadas(prev => prev.map(p => p.id === id ? { ...p, status: suspend ? 'suspended' : 'active' } : p))
  }

  async function changeRole(id: number, role: string) {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
  }

  const pending = posadas.filter(p => p.status === 'pending_review')
  const filteredPosadas = posadas.filter(p => (posadaFilter === 'all' || p.status === posadaFilter) && (!search || p.nombre.toLowerCase().includes(search.toLowerCase()) || p.destino.toLowerCase().includes(search.toLowerCase())))
  const filteredBookings = bookings.filter(b => (bookingFilter === 'all' || b.status === bookingFilter) && (!search || b.bookingCode.includes(search.toUpperCase()) || b.guestName.toLowerCase().includes(search.toLowerCase()) || b.posadaNombre.toLowerCase().includes(search.toLowerCase())))
  const filteredUsers = users.filter(u => (userFilter === 'all' || u.role === userFilter) && (!search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())))

  const NAV: { id: Tab; label: string; badge?: number }[] = [
    { id: 'overview',  label: 'Resumen' },
    { id: 'review',    label: 'Revisión', badge: stats?.pendingReview || undefined },
    { id: 'posadas',   label: 'Posadas' },
    { id: 'bookings',  label: 'Reservas', badge: stats?.pendingBookings || undefined },
    { id: 'users',     label: 'Usuarios' },
  ]

  return (
    <>
      <style>{`
        :root{--indigo:#1A2B4C;--cacao:#E67E22;--cacao-dark:#C96510;--sand:#FDFBF7;--muted:#7A8699;--line:rgba(26,43,76,0.09);--green:#10b981;--red:#ef4444;}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Inter',sans-serif;background:#F4F6F9;color:var(--indigo);}
        a{color:inherit;text-decoration:none;}

        /* Sidebar */
        .layout{display:grid;grid-template-columns:220px 1fr;min-height:100vh;}
        .sidebar{background:var(--indigo);color:white;display:flex;flex-direction:column;position:sticky;top:0;height:100vh;}
        .sb-logo{padding:1.5rem 1.4rem 1rem;font-size:1.3rem;font-weight:800;letter-spacing:-0.04em;border-bottom:1px solid rgba(255,255,255,0.08);flex-shrink:0;}
        .sb-logo span{color:var(--cacao);}
        .sb-badge{display:inline-block;background:rgba(239,68,68,0.9);color:white;font-size:0.65rem;font-weight:700;padding:0.15rem 0.45rem;border-radius:99px;margin-left:0.4rem;vertical-align:middle;}
        .sb-admin{padding:0.85rem 1.4rem;font-size:0.78rem;color:rgba(255,255,255,0.45);border-bottom:1px solid rgba(255,255,255,0.08);flex-shrink:0;}
        .sb-admin strong{display:block;color:rgba(255,255,255,0.75);font-size:0.82rem;margin-bottom:0.1rem;}
        .sb-nav{flex:1;padding:0.75rem 0;overflow-y:auto;}
        .sb-item{display:flex;align-items:center;gap:0.6rem;padding:0.7rem 1.4rem;font-size:0.88rem;font-weight:500;color:rgba(255,255,255,0.6);cursor:pointer;transition:all 0.18s;border-left:3px solid transparent;}
        .sb-item:hover{background:rgba(255,255,255,0.07);color:white;}
        .sb-item.active{background:rgba(230,126,34,0.15);color:white;border-left-color:var(--cacao);}
        .sb-badge-count{margin-left:auto;background:var(--cacao);color:white;font-size:0.65rem;font-weight:700;padding:0.15rem 0.45rem;border-radius:99px;}
        .sb-footer{padding:1rem 1.4rem;border-top:1px solid rgba(255,255,255,0.08);flex-shrink:0;}
        .sb-footer a{font-size:0.8rem;color:rgba(255,255,255,0.45);display:block;margin-bottom:0.4rem;transition:color 0.18s;}
        .sb-footer a:hover{color:rgba(255,255,255,0.75);}

        /* Main */
        .main{padding:2rem 2.5rem;overflow-x:hidden;}
        .page-title{font-size:1.5rem;font-weight:800;letter-spacing:-0.03em;margin-bottom:0.25rem;}
        .page-sub{font-size:0.85rem;color:var(--muted);margin-bottom:1.75rem;}

        /* Stats grid */
        .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-bottom:2rem;}
        .stat{background:white;border-radius:14px;padding:1.2rem 1.4rem;box-shadow:0 2px 8px rgba(26,43,76,0.06);}
        .stat-label{font-size:0.7rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);margin-bottom:0.4rem;}
        .stat-val{font-size:2rem;font-weight:800;letter-spacing:-0.03em;color:var(--indigo);}
        .stat-val.cacao{color:var(--cacao);}
        .stat-val.green{color:var(--green);}
        .stat-val.red{color:var(--red);}

        /* Table */
        .table-wrap{background:white;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(26,43,76,0.06);}
        .table-toolbar{padding:1rem 1.25rem;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;}
        .table-title{font-size:0.88rem;font-weight:700;color:var(--indigo);flex:1;}
        .search-input{padding:0.45rem 0.85rem;border:1.5px solid var(--line);border-radius:8px;font-size:0.82rem;font-family:inherit;color:var(--indigo);outline:none;width:200px;transition:border-color 0.18s;}
        .search-input:focus{border-color:var(--cacao);}
        .filter-select{padding:0.42rem 0.75rem;border:1.5px solid var(--line);border-radius:8px;font-size:0.8rem;font-family:inherit;color:var(--indigo);outline:none;background:white;cursor:pointer;}
        .tbl{width:100%;border-collapse:collapse;}
        .tbl th{font-size:0.68rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);padding:0.7rem 1rem;text-align:left;background:rgba(26,43,76,0.02);border-bottom:1.5px solid var(--line);}
        .tbl td{padding:0.8rem 1rem;font-size:0.84rem;border-bottom:1px solid var(--line);vertical-align:middle;}
        .tbl tr:last-child td{border-bottom:none;}
        .tbl tr:hover td{background:rgba(26,43,76,0.015);}
        .tbl-name{font-weight:600;}
        .tbl-sub{font-size:0.75rem;color:var(--muted);margin-top:0.1rem;}
        .tbl-link{color:var(--cacao);font-size:0.78rem;font-weight:600;}
        .tbl-link:hover{text-decoration:underline;}
        .action-btn{padding:0.28rem 0.7rem;border-radius:6px;font-size:0.75rem;font-weight:600;cursor:pointer;font-family:inherit;border:1.5px solid;transition:all 0.15s;}
        .btn-sus{color:var(--red);border-color:rgba(239,68,68,0.3);background:rgba(239,68,68,0.04);}
        .btn-sus:hover{background:rgba(239,68,68,0.1);}
        .btn-act{color:var(--green);border-color:rgba(16,185,129,0.3);background:rgba(16,185,129,0.04);}
        .btn-act:hover{background:rgba(16,185,129,0.1);}
        .role-select{padding:0.25rem 0.5rem;border:1.5px solid var(--line);border-radius:6px;font-size:0.78rem;font-family:inherit;color:var(--indigo);outline:none;background:white;cursor:pointer;}
        .empty-row td{text-align:center;padding:2.5rem;color:var(--muted);font-size:0.88rem;}
        .loading-row td{text-align:center;padding:2rem;color:var(--muted);font-size:0.85rem;}

        /* Review cards */
        .review-card{background:white;border-radius:14px;margin-bottom:0.85rem;overflow:hidden;box-shadow:0 2px 8px rgba(26,43,76,0.06);}
        .rc-header{display:flex;align-items:center;gap:1rem;padding:1.1rem 1.25rem;cursor:pointer;transition:background 0.15s;}
        .rc-header:hover{background:rgba(26,43,76,0.02);}
        .rc-img{width:72px;height:54px;border-radius:8px;object-fit:cover;background:rgba(26,43,76,0.06);flex-shrink:0;}
        .rc-info{flex:1;min-width:0;}
        .rc-name{font-weight:700;font-size:0.95rem;margin-bottom:0.2rem;}
        .rc-meta{font-size:0.78rem;color:var(--muted);display:flex;flex-wrap:wrap;gap:0.5rem;}
        .rc-tag{background:rgba(26,43,76,0.06);padding:0.15rem 0.5rem;border-radius:99px;font-size:0.7rem;font-weight:600;}
        .rc-chevron{color:var(--muted);transition:transform 0.2s;flex-shrink:0;}
        .rc-body{border-top:1.5px solid var(--line);padding:1.25rem;}
        .rc-imgs{display:flex;gap:0.5rem;overflow-x:auto;margin-bottom:1rem;}
        .rc-img-thumb{width:100px;height:75px;object-fit:cover;border-radius:8px;flex-shrink:0;}
        .rc-desc{font-size:0.86rem;color:var(--muted);line-height:1.65;margin-bottom:1.25rem;}
        .rc-actions{background:rgba(26,43,76,0.03);border-radius:10px;padding:1rem;}
        .rc-notes-label{font-size:0.72rem;font-weight:600;color:var(--indigo);display:block;margin-bottom:0.4rem;}
        .rc-notes{width:100%;padding:0.65rem 0.85rem;border:1.5px solid var(--line);border-radius:8px;font-family:inherit;font-size:0.84rem;outline:none;resize:vertical;transition:border-color 0.18s;margin-bottom:0.85rem;}
        .rc-notes:focus{border-color:var(--cacao);}
        .rc-btns{display:flex;align-items:center;gap:0.6rem;}
        .btn-approve{padding:0.55rem 1.25rem;border-radius:99px;font-size:0.84rem;font-weight:700;border:none;color:white;background:linear-gradient(135deg,var(--green),#059669);cursor:pointer;font-family:inherit;transition:all 0.18s;}
        .btn-approve:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 16px rgba(16,185,129,0.3);}
        .btn-reject{padding:0.55rem 1.1rem;border-radius:99px;font-size:0.84rem;font-weight:700;cursor:pointer;font-family:inherit;color:var(--red);background:rgba(239,68,68,0.07);border:1.5px solid rgba(239,68,68,0.25);transition:all 0.18s;}
        .btn-reject:hover:not(:disabled){background:rgba(239,68,68,0.14);}
        .btn-preview{display:inline-flex;align-items:center;gap:0.35rem;font-size:0.8rem;font-weight:600;color:var(--muted);padding:0.4rem 0.75rem;border:1.5px solid var(--line);border-radius:99px;background:white;transition:all 0.18s;margin-left:auto;}
        .btn-preview:hover{color:var(--indigo);border-color:rgba(26,43,76,0.25);}
        :disabled{opacity:0.5;cursor:not-allowed!important;transform:none!important;}
        .alert-banner{background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:10px;padding:0.85rem 1.1rem;font-size:0.84rem;color:#92400e;margin-bottom:1.5rem;display:flex;align-items:center;gap:0.6rem;}

        @media(max-width:768px){
          .layout{grid-template-columns:1fr;}
          .sidebar{display:none;}
          .main{padding:1.25rem;}
        }
      `}</style>

      <div className="layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sb-logo">RESER<span>-VE</span> <span className="sb-badge">ADMIN</span></div>
          <div className="sb-admin"><strong>{adminName}</strong>{adminEmail}</div>
          <nav className="sb-nav">
            {NAV.map(n => (
              <div key={n.id} className={`sb-item${tab === n.id ? ' active' : ''}`} onClick={() => { setTab(n.id); setSearch('') }}>
                {n.label}
                {n.badge ? <span className="sb-badge-count">{n.badge}</span> : null}
              </div>
            ))}
            <Link href="/mensajes" className="sb-item" style={{display:'block',marginTop:'0.25rem'}}>
              Mensajes
            </Link>
          </nav>
          <div className="sb-footer">
            <a href="/docs/Manual-RESER-VE.pdf" target="_blank" rel="noopener noreferrer">📘 Manual de la plataforma (PDF)</a>
            <Link href="/">← Volver al sitio</Link>
            <Link href="/api/auth/signout">Cerrar sesión</Link>
          </div>
        </aside>

        {/* Main */}
        <main className="main">

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <>
              <div className="page-title">Panel de administración</div>
              <div className="page-sub">Bienvenido, {adminName}. Aquí tienes el estado general de la plataforma.</div>

              {stats ? (
                <div className="stats">
                  <div className="stat"><div className="stat-label">Usuarios</div><div className="stat-val">{stats.totalUsers}</div></div>
                  <div className="stat"><div className="stat-label">Posadas</div><div className="stat-val">{stats.totalPosadas}</div></div>
                  <div className="stat"><div className="stat-label">Reservas</div><div className="stat-val">{stats.totalBookings}</div></div>
                  <div className="stat"><div className="stat-label">En revisión</div><div className={`stat-val ${stats.pendingReview > 0 ? 'red' : 'green'}`}>{stats.pendingReview}</div></div>
                  <div className="stat"><div className="stat-label">Reservas pendientes</div><div className="stat-val cacao">{stats.pendingBookings}</div></div>
                  <div className="stat"><div className="stat-label">Ingresos plataforma</div><div className="stat-val green">${Number(stats.revenue).toLocaleString()}</div></div>
                </div>
              ) : (
                <div style={{color:'var(--muted)',fontSize:'0.9rem'}}>Cargando estadísticas…</div>
              )}

              {stats && stats.pendingReview > 0 && (
                <div className="alert-banner">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>Tienes <strong>{stats.pendingReview} posada{stats.pendingReview > 1 ? 's' : ''}</strong> esperando revisión. <button onClick={() => setTab('review')} style={{background:'none',border:'none',color:'#92400e',fontWeight:700,cursor:'pointer',textDecoration:'underline',fontFamily:'inherit',fontSize:'inherit'}}>Revisar ahora →</button></span>
                </div>
              )}

              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'1rem',marginTop:'0.5rem'}}>
                {NAV.filter(n => n.id !== 'overview').map(n => (
                  <div key={n.id} onClick={() => setTab(n.id)} style={{background:'white',border:'1.5px solid var(--line)',borderRadius:'12px',padding:'1.1rem 1.3rem',cursor:'pointer',transition:'box-shadow 0.18s',boxShadow:'0 2px 8px rgba(26,43,76,0.05)'}} onMouseEnter={e=>(e.currentTarget.style.boxShadow='0 6px 20px rgba(26,43,76,0.10)')} onMouseLeave={e=>(e.currentTarget.style.boxShadow='0 2px 8px rgba(26,43,76,0.05)')}>
                    <div style={{fontWeight:700,fontSize:'0.9rem',marginBottom:'0.2rem'}}>{n.label}</div>
                    <div style={{fontSize:'0.78rem',color:'var(--muted)'}}>Gestionar →</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── REVIEW QUEUE ── */}
          {tab === 'review' && (
            <>
              <div className="page-title">Cola de revisión</div>
              <div className="page-sub">Aprueba o rechaza posadas antes de que sean públicas. Las rechazadas reciben una nota explicativa.</div>

              {loading && <div style={{color:'var(--muted)',fontSize:'0.88rem'}}>Cargando…</div>}

              {!loading && pending.length === 0 && (
                <div style={{background:'white',borderRadius:'14px',padding:'3rem',textAlign:'center',color:'var(--muted)',fontSize:'0.9rem',boxShadow:'0 2px 8px rgba(26,43,76,0.06)'}}>
                  🎉 No hay posadas pendientes de revisión.
                </div>
              )}

              {pending.map(p => {
                const imgs = Array.isArray(p.imgs) ? p.imgs : []
                const isOpen = expanded === p.id
                return (
                  <div key={p.id} className="review-card">
                    <div className="rc-header" onClick={() => setExpanded(isOpen ? null : p.id)}>
                      {imgs[0] ? <img src={imgs[0]} alt={p.nombre} className="rc-img" /> : <div className="rc-img" style={{display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem'}}>🏡</div>}
                      <div className="rc-info">
                        <div className="rc-name">{p.nombre}</div>
                        <div className="rc-meta">
                          <span className="rc-tag">{p.destino}</span>
                          <span className="rc-tag">{p.tipo}</span>
                          <span className="rc-tag">${p.precio}/noche</span>
                          {p.hostName && <span style={{color:'var(--muted)'}}>Posadero: <strong style={{color:'var(--indigo)'}}>{p.hostName}</strong></span>}
                          <span style={{color:'var(--muted)'}}>Enviada: {fmtDate(p.createdAt)}</span>
                        </div>
                      </div>
                      <svg className="rc-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:isOpen?'rotate(180deg)':undefined}}><polyline points="6 9 12 15 18 9"/></svg>
                    </div>

                    {isOpen && (
                      <div className="rc-body">
                        {imgs.length > 0 && (
                          <div className="rc-imgs">{imgs.map((img, i) => <img key={i} src={img} alt="" className="rc-img-thumb" />)}</div>
                        )}
                        <p className="rc-desc">{(p as any).descripcion ?? 'Sin descripción.'}</p>
                        <div className="rc-actions">
                          <label className="rc-notes-label">Notas (obligatorio para rechazar, opcional para aprobar)</label>
                          <textarea className="rc-notes" rows={3} value={reviewNotes[p.id] ?? ''} onChange={e => setReviewNotes(prev => ({ ...prev, [p.id]: e.target.value }))} placeholder="Ej: Faltan fotos del baño, mejora la descripción…" />
                          <div className="rc-btns">
                            <button className="btn-approve" disabled={reviewLoading === p.id} onClick={() => reviewPosada(p.id, 'approve')}>
                              {reviewLoading === p.id ? '…' : '✓ Aprobar y publicar'}
                            </button>
                            <button className="btn-reject" disabled={reviewLoading === p.id} onClick={() => reviewPosada(p.id, 'reject')}>
                              {reviewLoading === p.id ? '…' : 'Rechazar'}
                            </button>
                            <Link href={`/posadas/${p.slug}`} target="_blank" className="btn-preview">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                              Ver página
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}

          {/* ── POSADAS ── */}
          {tab === 'posadas' && (
            <>
              <div className="page-title">Todas las posadas</div>
              <div className="page-sub">Gestiona el estado de cada posada. Puedes suspender o reactivar cualquiera.</div>
              <div className="table-wrap">
                <div className="table-toolbar">
                  <span className="table-title">Posadas ({filteredPosadas.length})</span>
                  <input className="search-input" placeholder="Buscar…" value={search} onChange={e => setSearch(e.target.value)} />
                  <select className="filter-select" value={posadaFilter} onChange={e => setPosadaFilter(e.target.value)}>
                    <option value="all">Todos los estados</option>
                    {Object.entries(POSADA_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <table className="tbl">
                  <thead><tr><th>Posada</th><th>Destino</th><th>Precio</th><th>Posadero</th><th>Estado</th><th>Fecha</th><th>Acción</th></tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={7} style={{textAlign:'center',padding:'2rem',color:'var(--muted)'}}>Cargando…</td></tr>
                    : filteredPosadas.length === 0 ? <tr><td colSpan={7} style={{textAlign:'center',padding:'2rem',color:'var(--muted)'}}>Sin resultados</td></tr>
                    : filteredPosadas.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div className="tbl-name">{p.nombre}</div>
                          <Link href={`/posadas/${p.slug}`} target="_blank" className="tbl-link">Ver →</Link>
                        </td>
                        <td>{p.destino}</td>
                        <td>${p.precio}</td>
                        <td>
                          <div className="tbl-name" style={{fontWeight:500}}>{p.hostName || '—'}</div>
                          <div className="tbl-sub">{p.hostEmail}</div>
                        </td>
                        <td><Badge status={p.status} map={POSADA_STATUS} /></td>
                        <td style={{color:'var(--muted)',fontSize:'0.78rem'}}>{fmtDate(p.createdAt)}</td>
                        <td>
                          {p.status === 'active' && <button className="action-btn btn-sus" onClick={() => suspendPosada(p.id, true)}>Suspender</button>}
                          {(p.status === 'suspended' || p.status === 'rejected') && <button className="action-btn btn-act" onClick={() => suspendPosada(p.id, false)}>Reactivar</button>}
                          {p.status === 'pending_review' && <button className="action-btn btn-act" onClick={() => { setTab('review'); setExpanded(p.id) }}>Revisar</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── BOOKINGS ── */}
          {tab === 'bookings' && (
            <>
              <div className="page-title">Todas las reservas</div>
              <div className="page-sub">Historial completo de reservas en la plataforma.</div>
              <div className="table-wrap">
                <div className="table-toolbar">
                  <span className="table-title">Reservas ({filteredBookings.length})</span>
                  <input className="search-input" placeholder="Buscar código, viajero…" value={search} onChange={e => setSearch(e.target.value)} />
                  <select className="filter-select" value={bookingFilter} onChange={e => setBookingFilter(e.target.value)}>
                    <option value="all">Todos los estados</option>
                    {Object.entries(BOOKING_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <table className="tbl">
                  <thead><tr><th>Código</th><th>Posada</th><th>Viajero</th><th>Fechas</th><th>Total</th><th>Pago</th><th>Estado</th></tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={7} style={{textAlign:'center',padding:'2rem',color:'var(--muted)'}}>Cargando…</td></tr>
                    : filteredBookings.length === 0 ? <tr><td colSpan={7} style={{textAlign:'center',padding:'2rem',color:'var(--muted)'}}>Sin resultados</td></tr>
                    : filteredBookings.map(b => (
                      <tr key={b.id}>
                        <td><span style={{fontFamily:'monospace',fontWeight:700,fontSize:'0.82rem'}}>{b.bookingCode}</span></td>
                        <td>
                          <div className="tbl-name">{b.posadaNombre}</div>
                          {b.posadaSlug && <Link href={`/posadas/${b.posadaSlug}`} target="_blank" className="tbl-link">Ver →</Link>}
                        </td>
                        <td>
                          <div className="tbl-name" style={{fontWeight:500}}>{b.guestName}</div>
                          <div className="tbl-sub">{b.guestEmail}</div>
                        </td>
                        <td style={{fontSize:'0.8rem',color:'var(--muted)'}}>{b.checkIn} → {b.checkOut}<br/><span style={{color:'var(--indigo)',fontWeight:600}}>{b.nights}n</span></td>
                        <td style={{fontWeight:700}}>${b.totalPrice}</td>
                        <td style={{fontSize:'0.78rem',color:'var(--muted)'}}>{b.paymentMethod ?? '—'}</td>
                        <td><Badge status={b.status} map={BOOKING_STATUS} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── USERS ── */}
          {tab === 'users' && (
            <>
              <div className="page-title">Usuarios</div>
              <div className="page-sub">Gestiona los roles. Puedes hacer a alguien posadero, viajero o admin.</div>
              <div className="table-wrap">
                <div className="table-toolbar">
                  <span className="table-title">Usuarios ({filteredUsers.length})</span>
                  <input className="search-input" placeholder="Buscar nombre o email…" value={search} onChange={e => setSearch(e.target.value)} />
                  <select className="filter-select" value={userFilter} onChange={e => setUserFilter(e.target.value)}>
                    <option value="all">Todos los roles</option>
                    {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <table className="tbl">
                  <thead><tr><th>Usuario</th><th>Email</th><th>País</th><th>Rol</th><th>Registrado</th><th>Cambiar rol</th></tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={6} style={{textAlign:'center',padding:'2rem',color:'var(--muted)'}}>Cargando…</td></tr>
                    : filteredUsers.length === 0 ? <tr><td colSpan={6} style={{textAlign:'center',padding:'2rem',color:'var(--muted)'}}>Sin resultados</td></tr>
                    : filteredUsers.map(u => (
                      <tr key={u.id}>
                        <td><div className="tbl-name">{u.name}</div></td>
                        <td style={{fontSize:'0.8rem',color:'var(--muted)'}}>{u.email}</td>
                        <td style={{fontSize:'0.8rem',color:'var(--muted)'}}>{u.country ?? '—'}</td>
                        <td><Badge status={u.role} map={Object.fromEntries(Object.entries(ROLES).map(([k,v])=>[k,{...v,bg:`rgba(0,0,0,0.05)`}]))} /></td>
                        <td style={{fontSize:'0.78rem',color:'var(--muted)'}}>{fmtDate(u.createdAt)}</td>
                        <td>
                          {u.email !== adminEmail && (
                            <select className="role-select" value={u.role} onChange={e => changeRole(u.id, e.target.value)}>
                              <option value="traveler">Viajero</option>
                              <option value="host">Posadero</option>
                              <option value="admin">Admin</option>
                            </select>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

        </main>
      </div>
    </>
  )
}
