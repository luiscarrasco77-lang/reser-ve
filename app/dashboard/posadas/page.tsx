import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getDb } from '@/lib/db'
import { posadas } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import ResubmitButton from './ResubmitButton'

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  draft:          { label: 'Borrador',             color: '#7A8699', bg: 'rgba(122,134,153,0.1)',  icon: '📝' },
  pending_review: { label: 'Pendiente de revisión', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: '⏳' },
  active:         { label: 'Publicada',             color: '#10b981', bg: 'rgba(16,185,129,0.1)',  icon: '✓' },
  suspended:      { label: 'Suspendida',            color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  icon: '⚠' },
  rejected:       { label: 'Rechazada',             color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  icon: '✕' },
}

export default async function MisPosadasPage() {
  const session = await auth()
  if (!session?.user) redirect('/login?callbackUrl=/dashboard/posadas')

  const role = (session.user as any).role
  const userId = parseInt((session.user as any).id)
  if (role !== 'host' && role !== 'admin') redirect('/mis-reservas')

  const db = getDb()
  const hostPosadas = await db.select().from(posadas).where(eq(posadas.hostId, userId))

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
        .nav-link:hover,.nav-link.active{color:var(--cacao);}
        .main{max-width:900px;margin:0 auto;padding:2.5rem 1.5rem;}
        .page-title{font-family:'Playfair Display',Georgia,serif;font-size:1.8rem;font-weight:700;margin-bottom:0.3rem;}
        .page-sub{font-size:0.9rem;color:var(--muted);margin-bottom:2rem;}
        .posada-card{background:white;border:1.5px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 4px 20px rgba(26,43,76,0.06);margin-bottom:1.2rem;}
        .posada-top{display:flex;gap:1.2rem;padding:1.4rem;align-items:flex-start;}
        .posada-img{width:90px;height:70px;border-radius:10px;object-fit:cover;flex-shrink:0;background:rgba(26,43,76,0.07);}
        .posada-img-placeholder{width:90px;height:70px;border-radius:10px;background:rgba(26,43,76,0.07);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.4rem;}
        .posada-info{flex:1;min-width:0;}
        .posada-name{font-size:1.05rem;font-weight:700;margin-bottom:0.25rem;}
        .posada-meta{font-size:0.78rem;color:var(--muted);margin-bottom:0.5rem;}
        .status-badge{display:inline-flex;align-items:center;gap:0.3rem;padding:0.28rem 0.7rem;border-radius:99px;font-size:0.72rem;font-weight:700;}
        .rejection-panel{background:rgba(239,68,68,0.04);border-top:1.5px solid rgba(239,68,68,0.12);padding:1.1rem 1.4rem;}
        .rejection-title{font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#ef4444;margin-bottom:0.5rem;}
        .rejection-notes{font-size:0.86rem;color:var(--indigo);background:white;border:1.5px solid rgba(239,68,68,0.15);border-radius:10px;padding:0.75rem 1rem;line-height:1.6;}
        .pending-panel{background:rgba(245,158,11,0.04);border-top:1.5px solid rgba(245,158,11,0.15);padding:1rem 1.4rem;font-size:0.85rem;color:#92400e;}
        .active-panel{background:rgba(16,185,129,0.04);border-top:1.5px solid rgba(16,185,129,0.12);padding:1rem 1.4rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;}
        .actions{display:flex;gap:0.6rem;flex-wrap:wrap;margin-top:0.9rem;}
        .btn{display:inline-flex;align-items:center;gap:0.4rem;padding:0.55rem 1.1rem;border-radius:999px;font-size:0.82rem;font-weight:700;font-family:inherit;cursor:pointer;text-decoration:none;transition:all 0.15s;border:none;}
        .btn-primary{background:var(--cacao);color:white;}
        .btn-primary:hover{background:var(--cacao-dark);}
        .btn-outline{background:white;color:var(--indigo);border:1.5px solid var(--line);}
        .btn-outline:hover{border-color:rgba(26,43,76,0.25);background:rgba(26,43,76,0.02);}
        .btn-danger{background:rgba(239,68,68,0.08);color:#ef4444;border:1.5px solid rgba(239,68,68,0.15);}
        .empty{text-align:center;padding:4rem 1rem;color:var(--muted);}
        .new-btn{display:inline-flex;align-items:center;gap:0.5rem;padding:0.7rem 1.4rem;background:var(--cacao);color:white;border-radius:999px;text-decoration:none;font-weight:700;font-size:0.86rem;margin-bottom:1.5rem;transition:background 0.15s;}
        .new-btn:hover{background:var(--cacao-dark);}
      `}</style>

      <nav className="nav">
        <a href="/" className="nav-logo">RESER<span>-VE</span></a>
        <div className="nav-links">
          <a href="/dashboard" className="nav-link">Dashboard</a>
          <a href="/dashboard/posadas" className="nav-link active">Mis posadas</a>
          <a href="/dashboard/reservas" className="nav-link">Reservas</a>
          <a href="/dashboard/posada/nueva" className="nav-link">+ Nueva</a>
        </div>
      </nav>

      <main className="main">
        <div className="page-title">Mis posadas</div>
        <div className="page-sub">Gestiona tus posadas y el estado de revisión de cada una</div>

        <a href="/dashboard/posada/nueva" className="new-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Publicar nueva posada
        </a>

        {hostPosadas.length === 0 ? (
          <div className="empty">
            <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>🏡</div>
            <div style={{ fontWeight: 700, marginBottom: '0.4rem' }}>No tienes posadas aún</div>
            <div style={{ fontSize: '0.88rem', marginBottom: '1.5rem' }}>Publica tu primera posada y empieza a recibir viajeros</div>
            <a href="/dashboard/posada/nueva" className="new-btn">Publicar mi primera posada</a>
          </div>
        ) : (
          hostPosadas.map(p => {
            const st = statusConfig[p.status] ?? statusConfig.draft
            const img = (p.imgs as string[])[0]
            return (
              <div key={p.id} className="posada-card">
                <div className="posada-top">
                  {img
                    ? <img src={img} alt={p.nombre} className="posada-img" />
                    : <div className="posada-img-placeholder">🏠</div>
                  }
                  <div className="posada-info">
                    <div className="posada-name">{p.nombre}</div>
                    <div className="posada-meta">{p.destino} · {p.tipo} · ${p.precio}/noche</div>
                    <span className="status-badge" style={{ background: st.bg, color: st.color }}>
                      {st.icon} {st.label}
                    </span>

                    {/* Actions depending on status */}
                    <div className="actions">
                      {p.status === 'active' && (
                        <a href={`/posadas/${p.slug}`} className="btn btn-outline" target="_blank">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          Ver en RESER-VE
                        </a>
                      )}
                      {(p.status === 'rejected' || p.status === 'draft') && (
                        <>
                          <a href={`/dashboard/posada/${p.slug}/editar`} className="btn btn-primary">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Editar
                          </a>
                          <ResubmitButton slug={p.slug} status={p.status} />
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rejection panel */}
                {p.status === 'rejected' && (
                  <div className="rejection-panel">
                    <div className="rejection-title">✕ Motivo del rechazo — del equipo RESER-VE</div>
                    <div className="rejection-notes">
                      {p.reviewNotes ?? 'No se especificó un motivo. Contacta al equipo para más detalles.'}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.65rem' }}>
                      Haz click en <strong>"Editar"</strong> para corregir los puntos indicados y enviarla a revisión nuevamente.
                    </div>
                  </div>
                )}

                {/* Pending review panel */}
                {p.status === 'pending_review' && (
                  <div className="pending-panel">
                    ⏳ <strong>En revisión</strong> — El equipo de RESER-VE está revisando tu posada. Recibirás una notificación en cuanto haya una respuesta (normalmente en 24-48h).
                  </div>
                )}

                {/* Active panel */}
                {p.status === 'active' && (
                  <div className="active-panel">
                    <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                      ✓ Posada publicada y visible para viajeros
                    </span>
                    <a href={`/posadas/${p.slug}`} className="btn btn-outline" style={{ fontSize: '0.78rem' }} target="_blank">
                      Ver página →
                    </a>
                  </div>
                )}
              </div>
            )
          })
        )}
      </main>
    </>
  )
}
