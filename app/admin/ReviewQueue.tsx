'use client'

import { useState } from 'react'
import Link from 'next/link'

type Posada = {
  id: number; slug: string; nombre: string; destino: string; tipo: string;
  precio: number; habitaciones: number; descripcion: string; imgs: unknown;
  status: string; reviewNotes: string | null; createdAt: Date;
  hostId: number | null; hostNombre: string | null;
}
type Host = { id: number; name: string; email: string }

function fmt(date: Date | string) {
  return new Date(date).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function PosadaCard({ posada, host, onReviewed }: { posada: Posada; host: Host | undefined; onReviewed: (id: number, status: 'active' | 'rejected') => void }) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const imgs = (posada.imgs as string[]) ?? []

  async function act(action: 'approve' | 'reject') {
    if (action === 'reject' && !notes.trim()) {
      alert('Escribe una nota explicando el motivo del rechazo.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/posadas/${posada.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: notes || undefined }),
      })
      const data = await res.json()
      if (res.ok) onReviewed(posada.id, data.status)
      else alert(data.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="posada-card">
      <div className="posada-card-header" onClick={() => setExpanded(e => !e)}>
        <div className="posada-img-wrap">
          {imgs[0] && <img src={imgs[0]} alt={posada.nombre} className="posada-img" />}
        </div>
        <div className="posada-info">
          <div className="posada-nombre">{posada.nombre}</div>
          <div className="posada-meta">
            <span className="tag-dest">{posada.destino}</span>
            <span className="tag-tipo">{posada.tipo}</span>
            <span className="tag-price">${posada.precio}/noche</span>
            <span className="tag-hab">{posada.habitaciones} hab.</span>
          </div>
          <div className="posada-host">
            {host ? (
              <span>Posadero: <strong>{host.name}</strong> · {host.email}</span>
            ) : posada.hostNombre ? (
              <span>Posadero: <strong>{posada.hostNombre}</strong></span>
            ) : (
              <span style={{color:'#7A8699'}}>Sin posadero registrado</span>
            )}
          </div>
          <div className="posada-date">Enviada el {fmt(posada.createdAt)}</div>
        </div>
        <div className="posada-expand" aria-label={expanded ? 'Contraer' : 'Expandir'}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform: expanded ? 'rotate(180deg)' : undefined, transition: '0.2s'}}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="posada-card-body">
          {imgs.length > 0 && (
            <div className="img-strip">
              {imgs.slice(0, 5).map((img, i) => (
                <img key={i} src={img} alt="" className="img-strip-img" />
              ))}
            </div>
          )}
          <p className="posada-desc">{posada.descripcion}</p>

          <div className="review-actions">
            <div className="notes-wrap">
              <label className="notes-label">Notas de revisión (obligatorio para rechazar)</label>
              <textarea
                className="notes-input"
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ej: Las imágenes no muestran la habitación correctamente, añade fotos del baño y del área común…"
              />
            </div>
            <div className="action-row">
              <Link href={`/posadas/${posada.slug}`} className="btn-preview" target="_blank">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Ver posada
              </Link>
              <div style={{flex:1}} />
              <button className="btn-reject" disabled={loading} onClick={() => act('reject')}>
                {loading ? '…' : 'Rechazar'}
              </button>
              <button className="btn-approve" disabled={loading} onClick={() => act('approve')}>
                {loading ? '…' : '✓ Aprobar y publicar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ReviewedRow({ posada, host }: { posada: Posada; host: Host | undefined }) {
  const approved = posada.status === 'active'
  return (
    <div className="reviewed-row">
      <div style={{flex:1}}>
        <span className="rev-nombre">{posada.nombre}</span>
        <span className="rev-meta"> · {posada.destino} · {fmt(posada.createdAt)}</span>
      </div>
      {host && <span className="rev-host">{host.name}</span>}
      <span className={`rev-badge ${approved ? 'badge-active' : 'badge-rejected'}`}>
        {approved ? '✓ Publicada' : '✗ Rechazada'}
      </span>
      {posada.reviewNotes && (
        <span className="rev-notes" title={posada.reviewNotes}>📝</span>
      )}
    </div>
  )
}

export default function AdminReviewQueue({
  pending: initialPending,
  reviewed,
  hostMap,
  adminName,
}: {
  pending: Posada[]
  reviewed: Posada[]
  hostMap: Record<number, Host>
  adminName: string
}) {
  const [pending, setPending] = useState(initialPending)
  const [done, setDone] = useState<{ posada: Posada; status: 'active' | 'rejected' }[]>([])

  function onReviewed(id: number, status: 'active' | 'rejected') {
    const posada = pending.find(p => p.id === id)!
    setPending(prev => prev.filter(p => p.id !== id))
    setDone(prev => [{ posada, status }, ...prev])
  }

  return (
    <>
      <style>{`
        :root{--indigo:#1A2B4C;--cacao:#E67E22;--cacao-dark:#C96510;--sand:#FDFBF7;--muted:#7A8699;--line:rgba(26,43,76,0.09);--green:#10b981;--red:#ef4444;}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Inter',sans-serif;background:var(--sand);color:var(--indigo);}
        .top-nav{background:white;border-bottom:1.5px solid var(--line);padding:0 2rem;height:60px;display:flex;align-items:center;justify-content:space-between;}
        .logo{font-size:1.3rem;font-weight:800;letter-spacing:-0.04em;color:var(--indigo);text-decoration:none;}
        .logo span{color:var(--cacao);}
        .admin-badge{background:rgba(239,68,68,0.1);color:#dc2626;font-size:0.72rem;font-weight:700;padding:0.2rem 0.55rem;border-radius:99px;letter-spacing:0.05em;}
        .page{max-width:1000px;margin:0 auto;padding:2.5rem 1.5rem 5rem;}
        .page-title{font-size:1.6rem;font-weight:800;letter-spacing:-0.03em;margin-bottom:0.3rem;}
        .page-sub{font-size:0.87rem;color:var(--muted);margin-bottom:2rem;}
        .section-title{font-size:0.68rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--cacao);margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem;}
        .section-title::before{content:'';width:0.8rem;height:2px;background:var(--cacao);border-radius:2px;}
        .empty{background:white;border:1.5px dashed var(--line);border-radius:16px;padding:2.5rem;text-align:center;color:var(--muted);font-size:0.9rem;margin-bottom:2rem;}
        .posada-card{background:white;border:1.5px solid var(--line);border-radius:16px;margin-bottom:1rem;overflow:hidden;box-shadow:0 4px 16px rgba(26,43,76,0.06);transition:box-shadow 0.18s;}
        .posada-card:hover{box-shadow:0 8px 28px rgba(26,43,76,0.10);}
        .posada-card-header{display:flex;align-items:center;gap:1rem;padding:1.1rem 1.25rem;cursor:pointer;}
        .posada-img-wrap{flex-shrink:0;width:80px;height:60px;border-radius:10px;overflow:hidden;background:#e8edf0;}
        .posada-img{width:100%;height:100%;object-fit:cover;}
        .posada-info{flex:1;min-width:0;}
        .posada-nombre{font-size:1rem;font-weight:700;color:var(--indigo);margin-bottom:0.3rem;}
        .posada-meta{display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.3rem;}
        .tag-dest,.tag-tipo,.tag-price,.tag-hab{font-size:0.72rem;padding:0.18rem 0.55rem;border-radius:99px;font-weight:600;}
        .tag-dest{background:rgba(26,43,76,0.07);color:var(--indigo);}
        .tag-tipo{background:rgba(230,126,34,0.1);color:var(--cacao);}
        .tag-price{background:rgba(16,185,129,0.1);color:#047857;}
        .tag-hab{background:rgba(26,43,76,0.05);color:var(--muted);}
        .posada-host{font-size:0.8rem;color:var(--muted);margin-bottom:0.2rem;}
        .posada-date{font-size:0.75rem;color:var(--muted);}
        .posada-expand{flex-shrink:0;color:var(--muted);}
        .posada-card-body{border-top:1.5px solid var(--line);padding:1.25rem;}
        .img-strip{display:flex;gap:0.5rem;overflow-x:auto;margin-bottom:1rem;}
        .img-strip-img{width:100px;height:75px;object-fit:cover;border-radius:8px;flex-shrink:0;}
        .posada-desc{font-size:0.87rem;color:var(--muted);line-height:1.65;margin-bottom:1.25rem;}
        .review-actions{background:rgba(26,43,76,0.03);border-radius:12px;padding:1rem;}
        .notes-label{font-size:0.73rem;font-weight:600;color:var(--indigo);display:block;margin-bottom:0.45rem;}
        .notes-input{width:100%;padding:0.7rem 0.9rem;border:1.5px solid var(--line);border-radius:10px;font-family:inherit;font-size:0.85rem;color:var(--indigo);background:white;outline:none;resize:vertical;transition:border-color 0.18s;}
        .notes-input:focus{border-color:var(--cacao);}
        .notes-wrap{margin-bottom:0.85rem;}
        .action-row{display:flex;align-items:center;gap:0.65rem;}
        .btn-preview{display:inline-flex;align-items:center;gap:0.4rem;font-size:0.82rem;font-weight:600;color:var(--muted);text-decoration:none;padding:0.55rem 0.9rem;border:1.5px solid var(--line);border-radius:99px;background:white;transition:all 0.18s;}
        .btn-preview:hover{color:var(--indigo);border-color:rgba(26,43,76,0.25);}
        .btn-reject{padding:0.6rem 1.2rem;border-radius:99px;font-size:0.84rem;font-weight:700;border:1.5px solid rgba(239,68,68,0.3);color:var(--red);background:rgba(239,68,68,0.06);cursor:pointer;font-family:inherit;transition:all 0.18s;}
        .btn-reject:hover:not(:disabled){background:rgba(239,68,68,0.12);}
        .btn-reject:disabled{opacity:0.5;cursor:not-allowed;}
        .btn-approve{padding:0.6rem 1.4rem;border-radius:99px;font-size:0.84rem;font-weight:700;border:none;color:white;background:linear-gradient(135deg,var(--green),#059669);cursor:pointer;font-family:inherit;box-shadow:0 6px 16px rgba(16,185,129,0.25);transition:all 0.18s;}
        .btn-approve:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 20px rgba(16,185,129,0.33);}
        .btn-approve:disabled{opacity:0.5;cursor:not-allowed;transform:none;}
        .reviewed-section{margin-top:2.5rem;}
        .reviewed-list{background:white;border:1.5px solid var(--line);border-radius:14px;overflow:hidden;}
        .reviewed-row{display:flex;align-items:center;gap:0.75rem;padding:0.8rem 1.25rem;border-bottom:1px solid var(--line);font-size:0.83rem;}
        .reviewed-row:last-child{border-bottom:none;}
        .rev-nombre{font-weight:600;color:var(--indigo);}
        .rev-meta{color:var(--muted);}
        .rev-host{color:var(--muted);flex-shrink:0;}
        .rev-badge{flex-shrink:0;font-size:0.72rem;font-weight:700;padding:0.2rem 0.6rem;border-radius:99px;}
        .badge-active{background:rgba(16,185,129,0.1);color:#047857;}
        .badge-rejected{background:rgba(239,68,68,0.08);color:var(--red);}
        .rev-notes{cursor:help;flex-shrink:0;}
        .just-reviewed{border-left:3px solid var(--cacao);background:rgba(230,126,34,0.04);}
      `}</style>

      <nav className="top-nav">
        <Link href="/" className="logo">RESER<span>-VE</span></Link>
        <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
          <span style={{fontSize:'0.84rem',color:'var(--muted)'}}>Hola, {adminName}</span>
          <span className="admin-badge">ADMIN</span>
          <Link href="/api/auth/signout" style={{fontSize:'0.82rem',color:'var(--muted)',textDecoration:'none',marginLeft:'0.5rem'}}>Salir</Link>
        </div>
      </nav>

      <div className="page">
        <div className="page-title">Panel de revisión</div>
        <div className="page-sub">Revisa y aprueba las posadas antes de que sean visibles al público.</div>

        <div className="section-title">Cola de revisión ({pending.length})</div>

        {pending.length === 0 ? (
          <div className="empty">
            🎉 No hay posadas pendientes de revisión.
          </div>
        ) : (
          pending.map(p => (
            <PosadaCard
              key={p.id}
              posada={p}
              host={p.hostId ? hostMap[p.hostId] : undefined}
              onReviewed={onReviewed}
            />
          ))
        )}

        {done.length > 0 && (
          <>
            <div className="section-title" style={{marginTop:'2rem'}}>Revisadas en esta sesión ({done.length})</div>
            <div className="reviewed-list">
              {done.map(({ posada, status }) => (
                <ReviewedRow
                  key={posada.id}
                  posada={{ ...posada, status }}
                  host={posada.hostId ? hostMap[posada.hostId] : undefined}
                />
              ))}
            </div>
          </>
        )}

        {reviewed.length > 0 && (
          <div className="reviewed-section">
            <div className="section-title">Revisadas anteriormente ({reviewed.length})</div>
            <div className="reviewed-list">
              {reviewed.map(p => (
                <ReviewedRow
                  key={p.id}
                  posada={p}
                  host={p.hostId ? hostMap[p.hostId] : undefined}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
