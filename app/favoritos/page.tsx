'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import NavUser from '@/components/NavUser'

type Fav = {
  id: number; slug: string; nombre: string; destino: string; tipo: string
  precio: number; rating: number; reviews: number; imgs: string[]; status: string
}

export default function FavoritosPage() {
  const { status } = useSession()
  const router = useRouter()
  const [posadas, setPosadas] = useState<Fav[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login?callbackUrl=/favoritos')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/favorites')
      .then(r => r.ok ? r.json() : null)
      .then(d => setPosadas(d?.posadas?.filter((p: Fav) => p.status === 'active') ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [status])

  async function remove(posadaId: number) {
    setPosadas(prev => prev.filter(p => p.id !== posadaId))
    await fetch('/api/favorites', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ posadaId }),
    }).catch(() => {})
  }

  return (
    <>
      <style>{`
        :root{--indigo:#1A2B4C;--cacao:#E67E22;--sand:#FDFBF7;--muted:#7A8699;--line:rgba(26,43,76,0.08);}
        *,*::before,*::after{box-sizing:border-box;}
        body{font-family:'Inter',sans-serif;background:var(--sand);color:var(--indigo);margin:0;}
        .nav{background:white;border-bottom:1.5px solid var(--line);padding:0 2rem;height:64px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;}
        .nav-logo{font-size:1.25rem;font-weight:800;letter-spacing:-0.04em;color:var(--indigo);text-decoration:none;}
        .nav-logo span{color:var(--cacao);}
        .main{max-width:1100px;margin:0 auto;padding:2.5rem 1.5rem 5rem;}
        .page-title{font-family:'Playfair Display',Georgia,serif;font-size:1.9rem;font-weight:700;margin-bottom:0.3rem;}
        .page-sub{font-size:0.9rem;color:var(--muted);margin-bottom:2rem;}
        .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.25rem;}
        .card{background:white;border:1.5px solid var(--line);border-radius:18px;overflow:hidden;text-decoration:none;color:inherit;display:block;transition:all 0.18s;}
        .card:hover{box-shadow:0 12px 32px rgba(26,43,76,0.12);transform:translateY(-3px);}
        .card-img{width:100%;height:170px;object-fit:cover;display:block;background:#eee;}
        .card-body{padding:1rem 1.1rem 1.2rem;}
        .card-tipo{font-size:0.68rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--cacao);font-weight:700;}
        .card-nombre{font-weight:700;font-size:1rem;margin:0.2rem 0;}
        .card-meta{font-size:0.8rem;color:var(--muted);display:flex;justify-content:space-between;align-items:center;margin-top:0.6rem;}
        .card-precio{font-weight:800;color:var(--indigo);}
        .rm{display:inline-flex;align-items:center;gap:0.35rem;background:none;border:none;color:#dc2626;font-size:0.78rem;font-weight:600;cursor:pointer;font-family:inherit;margin-top:0.5rem;padding:0;}
        .empty{text-align:center;padding:4rem 1rem;color:var(--muted);}
        .empty a{color:var(--cacao);font-weight:700;text-decoration:none;}
      `}</style>

      <nav className="nav">
        <Link href="/" className="nav-logo">RESER<span>-VE</span></Link>
        <NavUser />
      </nav>

      <main className="main">
        <div className="page-title">Mis favoritos</div>
        <div className="page-sub">Las posadas que has guardado para tu próxima escapada.</div>

        {loading ? (
          <div className="empty">Cargando…</div>
        ) : posadas.length === 0 ? (
          <div className="empty">
            Aún no has guardado posadas.<br />
            <Link href="/buscar">Explorar posadas →</Link>
          </div>
        ) : (
          <div className="grid">
            {posadas.map(p => (
              <div key={p.id}>
                <Link href={`/posadas/${p.slug}`} className="card">
                  <img className="card-img" src={p.imgs?.[0] ?? ''} alt={p.nombre} loading="lazy" />
                  <div className="card-body">
                    <div className="card-tipo">{p.tipo} · {p.destino}</div>
                    <div className="card-nombre">{p.nombre}</div>
                    <div className="card-meta">
                      <span>★ {p.rating} · {p.reviews} reseñas</span>
                      <span className="card-precio">${p.precio}<span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '0.72rem' }}>/noche</span></span>
                    </div>
                  </div>
                </Link>
                <button className="rm" onClick={() => remove(p.id)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
