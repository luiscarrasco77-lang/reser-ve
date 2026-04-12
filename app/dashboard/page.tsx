import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getDb } from '@/lib/db'
import { bookings, posadas } from '@/lib/db/schema'
import { eq, count, sum } from 'drizzle-orm'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login?callbackUrl=/dashboard')

  const role = (session.user as any).role
  const userId = parseInt((session.user as any).id)

  if (role !== 'host' && role !== 'admin') {
    redirect('/mis-reservas')
  }

  const db = getDb()

  // Get host's posadas
  const hostPosadas = await db.select().from(posadas).where(eq(posadas.hostId, userId))
  const posadaIds = hostPosadas.map(p => p.id)

  // Get bookings for all posadas
  let allBookings: any[] = []
  if (posadaIds.length > 0) {
    const results = await Promise.all(
      posadaIds.map(pid => db.select().from(bookings).where(eq(bookings.posadaId, pid)))
    )
    allBookings = results.flat()
  }

  const totalBookings = allBookings.length
  const pendingBookings = allBookings.filter(b => b.status === 'pending').length
  const confirmedBookings = allBookings.filter(b => b.status === 'confirmed').length
  const totalEarned = allBookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + b.totalPrice, 0)

  const recentBookings = allBookings
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

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

  return (
    <>
      <style>{`
        :root{--indigo:#1A2B4C;--cacao:#E67E22;--cacao-dark:#C96510;--sand:#FDFBF7;--muted:#7A8699;--line:rgba(26,43,76,0.08);}
        *,*::before,*::after{box-sizing:border-box;}
        body{font-family:'Inter',sans-serif;background:var(--sand);color:var(--indigo);margin:0;}
        .dash-nav{background:white;border-bottom:1.5px solid var(--line);padding:0 2rem;height:64px;display:flex;align-items:center;justify-content:space-between;}
        .dash-nav-logo{font-size:1.3rem;font-weight:800;letter-spacing:-0.04em;color:var(--indigo);text-decoration:none;}
        .dash-nav-logo span{color:var(--cacao);}
        .dash-nav-links{display:flex;align-items:center;gap:1.5rem;}
        .dash-nav-link{font-size:0.84rem;font-weight:600;color:var(--muted);text-decoration:none;transition:color 0.18s;}
        .dash-nav-link:hover{color:var(--indigo);}
        .dash-nav-link.active{color:var(--cacao);}
        .dash-main{max-width:1100px;margin:0 auto;padding:2.5rem 1.5rem;}
        .dash-header{margin-bottom:2rem;}
        .dash-hello{font-family:'Playfair Display',Georgia,serif;font-size:1.9rem;font-weight:700;margin-bottom:0.3rem;}
        .dash-sub{font-size:0.9rem;color:var(--muted);}
        .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1.2rem;margin-bottom:2.5rem;}
        .stat-card{background:white;border:1.5px solid var(--line);border-radius:17px;padding:1.4rem 1.6rem;box-shadow:0 8px 32px rgba(26,43,76,0.06);}
        .stat-label{font-size:0.72rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);margin-bottom:0.5rem;}
        .stat-value{font-size:2rem;font-weight:800;color:var(--indigo);letter-spacing:-0.03em;}
        .stat-value.cacao{color:var(--cacao);}
        .section-title{font-size:1rem;font-weight:700;margin-bottom:1rem;color:var(--indigo);}
        .bookings-table{background:white;border:1.5px solid var(--line);border-radius:17px;overflow:hidden;box-shadow:0 8px 32px rgba(26,43,76,0.06);}
        .table-head{display:grid;grid-template-columns:1fr 1fr 1.2fr 1fr 100px;padding:0.8rem 1.4rem;background:rgba(26,43,76,0.03);font-size:0.72rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--muted);border-bottom:1.5px solid var(--line);}
        .table-row{display:grid;grid-template-columns:1fr 1fr 1.2fr 1fr 100px;padding:1rem 1.4rem;border-bottom:1px solid var(--line);font-size:0.85rem;align-items:center;transition:background 0.15s;}
        .table-row:last-child{border-bottom:none;}
        .table-row:hover{background:rgba(26,43,76,0.02);}
        .status-badge{display:inline-flex;align-items:center;padding:0.25rem 0.65rem;border-radius:99px;font-size:0.72rem;font-weight:700;}
        .quick-actions{display:flex;gap:1rem;margin-top:2rem;flex-wrap:wrap;}
        .action-btn{display:inline-flex;align-items:center;gap:0.5rem;padding:0.8rem 1.4rem;border-radius:12px;font-size:0.87rem;font-weight:600;font-family:inherit;text-decoration:none;cursor:pointer;transition:all 0.18s;border:none;}
        .action-btn-primary{background:var(--cacao);color:white;}
        .action-btn-primary:hover{background:var(--cacao-dark);transform:translateY(-1px);}
        .action-btn-secondary{background:white;color:var(--indigo);border:1.5px solid var(--line);}
        .action-btn-secondary:hover{border-color:rgba(26,43,76,0.22);background:rgba(26,43,76,0.02);}
        .empty-state{text-align:center;padding:3rem 1rem;color:var(--muted);}
        .empty-state p{font-size:0.9rem;margin-bottom:1rem;}
      `}</style>

      <nav className="dash-nav">
        <a href="/" className="dash-nav-logo">RESER<span>-VE</span></a>
        <div className="dash-nav-links">
          <a href="/dashboard" className="dash-nav-link active">Dashboard</a>
          <a href="/dashboard/reservas" className="dash-nav-link">Reservas</a>
          <a href="/dashboard/posada/nueva" className="dash-nav-link">Nueva posada</a>
          <a href="/api/auth/signout" className="dash-nav-link">Cerrar sesión</a>
        </div>
      </nav>

      <main className="dash-main">
        <div className="dash-header">
          <div className="dash-hello">Hola, {session.user.name?.split(' ')[0]}</div>
          <div className="dash-sub">Aquí tienes un resumen de tu actividad</div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total reservas</div>
            <div className="stat-value">{totalBookings}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pendientes</div>
            <div className="stat-value" style={{color: '#f59e0b'}}>{pendingBookings}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Posadas activas</div>
            <div className="stat-value">{hostPosadas.filter(p => p.status === 'active').length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total ganado</div>
            <div className="stat-value cacao">${totalEarned.toLocaleString()}</div>
          </div>
        </div>

        <div className="section-title">Reservas recientes</div>
        <div className="bookings-table">
          {recentBookings.length === 0 ? (
            <div className="empty-state">
              <p>Aún no tienes reservas.</p>
              <a href="/dashboard/posada/nueva" className="action-btn action-btn-primary" style={{display:'inline-flex',textDecoration:'none'}}>Publicar mi primera posada</a>
            </div>
          ) : (
            <>
              <div className="table-head">
                <span>Posada</span>
                <span>Huésped ID</span>
                <span>Check-in / Check-out</span>
                <span>Total</span>
                <span>Estado</span>
              </div>
              {recentBookings.map(b => {
                const posada = hostPosadas.find(p => p.id === b.posadaId)
                return (
                  <div key={b.id} className="table-row">
                    <span style={{fontWeight:600}}>{posada?.nombre ?? '—'}</span>
                    <span style={{color:'var(--muted)',fontSize:'0.8rem'}}>#{b.guestId}</span>
                    <span style={{color:'var(--muted)'}}>{b.checkIn} → {b.checkOut}</span>
                    <span style={{fontWeight:700}}>${b.totalPrice}</span>
                    <span>
                      <span className="status-badge" style={{background:`${statusColor[b.status]}18`,color:statusColor[b.status]}}>
                        {statusLabel[b.status] ?? b.status}
                      </span>
                    </span>
                  </div>
                )
              })}
            </>
          )}
        </div>

        <div className="quick-actions">
          <a href="/dashboard/posada/nueva" className="action-btn action-btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva posada
          </a>
          <a href="/dashboard/reservas" className="action-btn action-btn-secondary">
            Ver todas las reservas
          </a>
        </div>
      </main>
    </>
  )
}
