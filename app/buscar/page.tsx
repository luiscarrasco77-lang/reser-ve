'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { posadas as todasLasPosadas } from '@/lib/data'

const destinos = ['Todos', 'Los Roques', 'Mérida', 'Mochima', 'Morrocoy', 'Canaima', 'Isla Margarita']

function BuscarContent() {
  const searchParams = useSearchParams()
  const destinoParam = searchParams.get('destino') || 'Todos'
  const initialDestino = destinos.includes(destinoParam) ? destinoParam : 'Todos'

  const [destino, setDestino] = useState(initialDestino)
  const [precioMax, setPrecioMax] = useState(200)
  const [orden, setOrden] = useState('rating')

  useEffect(() => {
    const d = searchParams.get('destino') || 'Todos'
    setDestino(destinos.includes(d) ? d : 'Todos')
  }, [searchParams])

  const filtradas = todasLasPosadas
    .filter(p => destino === 'Todos' || p.destino === destino)
    .filter(p => p.precio <= precioMax)
    .sort((a, b) => orden === 'precio' ? a.precio - b.precio : b.rating - a.rating)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        :root {
          --indigo:#1A2B4C; --sand:#FDFBF7; --cacao:#E67E22; --cacao-dark:#C96510;
          --text:#23324A; --muted:#6B7482; --line:rgba(26,43,76,0.10);
          --shadow:0 8px 30px rgba(26,43,76,0.08);
        }
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Inter',sans-serif;background:radial-gradient(circle at top left,rgba(230,126,34,0.06) 0%,transparent 30%),linear-gradient(180deg,#fffefb 0%,var(--sand) 100%);color:var(--text);min-height:100vh;}
        .grain{position:fixed;inset:0;pointer-events:none;z-index:100;opacity:0.018;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");}
        .nav{position:sticky;top:0;z-index:60;display:flex;align-items:center;justify-content:space-between;padding:1rem 2rem;background:rgba(253,251,247,0.92);backdrop-filter:blur(18px);border-bottom:1px solid var(--line);box-shadow:0 4px 20px rgba(26,43,76,0.05);}
        .logo{font-size:1.6rem;font-weight:800;letter-spacing:-0.04em;color:var(--indigo);text-decoration:none;}
        .logo span{color:var(--cacao);}
        .nav-links{display:flex;align-items:center;gap:1rem;}
        .nav-link{font-size:0.88rem;color:rgba(26,43,76,0.65);text-decoration:none;font-weight:500;transition:color 0.2s;}
        .nav-link:hover{color:var(--indigo);}
        .nav-cta{padding:0.65rem 1.1rem;border-radius:999px;font-size:0.84rem;font-weight:600;text-decoration:none;background:var(--cacao);color:white;box-shadow:0 8px 20px rgba(230,126,34,0.22);transition:all 0.22s;}
        .nav-cta:hover{background:var(--cacao-dark);transform:translateY(-1px);}
        @media(max-width:768px){.nav-links{display:none;}}
        .page{max-width:1200px;margin:0 auto;padding:2.5rem 1.5rem 5rem;}
        .page-header{margin-bottom:2rem;}
        .page-header h1{font-size:clamp(1.8rem,4vw,2.4rem);font-weight:800;letter-spacing:-0.05em;color:var(--indigo);margin-bottom:0.3rem;}
        .page-header h1 em{font-style:normal;color:var(--cacao);}
        .page-header p{font-size:0.88rem;color:var(--muted);}
        .layout{display:grid;grid-template-columns:240px 1fr;gap:2rem;}
        @media(max-width:860px){.layout{grid-template-columns:1fr;}.sidebar{display:none;}}
        .sidebar{position:sticky;top:5.5rem;height:fit-content;}
        .sidebar-card{background:white;border:1px solid var(--line);border-radius:20px;padding:1.5rem;box-shadow:var(--shadow);}
        .filter-title{font-size:0.68rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--muted);margin-bottom:0.9rem;font-weight:600;}
        .dest-list{display:flex;flex-direction:column;gap:0.15rem;margin-bottom:1.5rem;}
        .dest-btn{display:flex;align-items:center;justify-content:space-between;width:100%;padding:0.5rem 0.7rem;border-radius:10px;font-size:0.87rem;font-family:'Inter',sans-serif;font-weight:500;background:transparent;border:none;color:var(--muted);cursor:pointer;transition:all 0.2s;text-align:left;}
        .dest-btn:hover{background:rgba(26,43,76,0.04);color:var(--indigo);}
        .dest-btn.active{background:rgba(230,126,34,0.08);color:var(--cacao);}
        .dest-dot{width:7px;height:7px;border-radius:50%;background:var(--cacao);opacity:0;transition:opacity 0.2s;flex-shrink:0;}
        .dest-btn.active .dest-dot{opacity:1;}
        .price-display{font-size:1.5rem;font-weight:800;letter-spacing:-0.04em;color:var(--indigo);margin-bottom:0.45rem;}
        .price-display span{font-size:0.78rem;font-weight:400;color:var(--muted);}
        .price-slider{width:100%;accent-color:var(--cacao);margin-bottom:0.3rem;}
        .price-labels{display:flex;justify-content:space-between;font-size:0.7rem;color:var(--muted);}
        .divider-h{height:1px;background:var(--line);margin:1.25rem 0;}
        .sort-opts{display:flex;gap:0.5rem;}
        .sort-btn{flex:1;padding:0.55rem;border-radius:10px;font-size:0.8rem;font-weight:600;font-family:'Inter',sans-serif;cursor:pointer;transition:all 0.2s;border:1px solid var(--line);background:transparent;color:var(--muted);}
        .sort-btn.active{background:var(--indigo);color:white;border-color:var(--indigo);}
        .results-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;}
        .results-count{font-size:0.85rem;color:var(--muted);}
        .results-count strong{color:var(--indigo);font-weight:700;}
        .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:1.25rem;}
        .card{background:white;border:1px solid var(--line);border-radius:24px;overflow:hidden;text-decoration:none;color:inherit;display:block;box-shadow:var(--shadow);transition:all 0.32s ease;}
        .card:hover{transform:translateY(-4px);box-shadow:0 20px 50px rgba(26,43,76,0.12);border-color:rgba(230,126,34,0.2);}
        .card-img{position:relative;aspect-ratio:4/3;overflow:hidden;}
        .card-img img{width:100%;height:100%;object-fit:cover;transition:transform 0.5s ease;}
        .card:hover .card-img img{transform:scale(1.06);}
        .card-badge{position:absolute;top:0.75rem;left:0.75rem;padding:0.3rem 0.75rem;border-radius:999px;font-size:0.68rem;font-weight:700;background:rgba(230,126,34,0.9);color:white;}
        .card-price{position:absolute;bottom:0.75rem;right:0.75rem;background:rgba(253,251,247,0.95);border:1px solid rgba(26,43,76,0.08);padding:0.3rem 0.7rem;border-radius:999px;font-size:0.82rem;font-weight:800;color:var(--indigo);}
        .card-body{padding:1.1rem 1.2rem 1.3rem;}
        .card-name{font-size:1.05rem;font-weight:800;letter-spacing:-0.03em;color:var(--indigo);margin-bottom:0.3rem;line-height:1.3;}
        .card-meta{display:flex;align-items:center;gap:0.6rem;margin-bottom:0.65rem;}
        .card-rating{font-size:0.78rem;color:var(--cacao);font-weight:700;}
        .card-reviews{font-size:0.74rem;color:var(--muted);}
        .card-rooms{font-size:0.74rem;color:var(--muted);margin-left:auto;}
        .card-tags{display:flex;gap:0.35rem;flex-wrap:wrap;}
        .tag{font-size:0.68rem;padding:0.22rem 0.55rem;border-radius:999px;border:1px solid rgba(26,43,76,0.09);color:var(--muted);}
        .empty{text-align:center;padding:5rem 2rem;}
        .empty p{font-size:1.1rem;font-weight:700;color:var(--indigo);margin-bottom:0.4rem;}
        .empty span{font-size:0.88rem;color:var(--muted);}
      `}</style>
      <div className="grain" />
      <nav className="nav">
        <Link href="/" className="logo">RESER<span>-VE</span></Link>
        <div className="nav-links">
          <Link href="/buscar" className="nav-link">Destinos</Link>
          <Link href="/registro-posada" className="nav-link">Posaderos</Link>
          <Link href="/#como-funciona" className="nav-link">Cómo funciona</Link>
          <Link href="/registro-posada" className="nav-cta">Registra tu posada</Link>
        </div>
      </nav>
      <div className="page">
        <div className="page-header">
          <h1>Posadas en <em>{destino === 'Todos' ? 'Venezuela' : destino}</em></h1>
          <p>{filtradas.length} alojamientos disponibles · Precios en USD por noche</p>
        </div>
        <div className="layout">
          <aside className="sidebar">
            <div className="sidebar-card">
              <div className="filter-title">Destino</div>
              <div className="dest-list">
                {destinos.map(d => (
                  <button key={d} className={`dest-btn ${destino === d ? 'active' : ''}`} onClick={() => setDestino(d)}>
                    {d}<div className="dest-dot" />
                  </button>
                ))}
              </div>
              <div className="divider-h" />
              <div className="filter-title">Precio máximo / noche</div>
              <div className="price-display">${precioMax} <span>USD</span></div>
              <input type="range" className="price-slider" min={40} max={200} value={precioMax} onChange={e => setPrecioMax(Number(e.target.value))} step={5} />
              <div className="price-labels"><span>$40</span><span>$200</span></div>
              <div className="divider-h" />
              <div className="filter-title">Ordenar por</div>
              <div className="sort-opts">
                <button className={`sort-btn ${orden === 'rating' ? 'active' : ''}`} onClick={() => setOrden('rating')}>Valoración</button>
                <button className={`sort-btn ${orden === 'precio' ? 'active' : ''}`} onClick={() => setOrden('precio')}>Precio</button>
              </div>
            </div>
          </aside>
          <main>
            <div className="results-bar">
              <p className="results-count"><strong>{filtradas.length}</strong> posadas encontradas</p>
            </div>
            {filtradas.length === 0 ? (
              <div className="empty">
                <p>Sin resultados</p>
                <span>Prueba con otro destino o ajusta el rango de precio</span>
              </div>
            ) : (
              <div className="grid">
                {filtradas.map(p => (
                  <Link href={`/posadas/${p.slug}`} className="card" key={p.slug}>
                    <div className="card-img">
                      <img src={p.imgs[0]} alt={p.nombre} />
                      <div className="card-badge">{p.tipo}</div>
                      <div className="card-price">${p.precio} / noche</div>
                    </div>
                    <div className="card-body">
                      <div className="card-name">{p.nombre}</div>
                      <div className="card-meta">
                        <span className="card-rating">★ {p.rating}</span>
                        <span className="card-reviews">({p.reviews} reseñas)</span>
                        <span className="card-rooms">{p.habitaciones} hab.</span>
                      </div>
                      <div className="card-tags">
                        {p.tags.map(t => <span className="tag" key={t}>{t}</span>)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
}

export default function Buscar() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',background:'#FDFBF7',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Inter,sans-serif',color:'#1A2B4C'}}>Cargando posadas…</div>}>
      <BuscarContent />
    </Suspense>
  )
}
