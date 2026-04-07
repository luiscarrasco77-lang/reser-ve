'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { posadas as todasLasPosadas } from '@/lib/data'

const destinos = ['Todos', 'Los Roques', 'Mérida', 'Mochima', 'Morrocoy', 'Canaima', 'Isla Margarita']

function renderStars(rating: number) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5 ? 1 : 0
  const empty = 5 - full - half
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty)
}

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

  const sliderPct = ((precioMax - 40) / (200 - 40)) * 100

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,700&family=Inter:wght@300;400;500;600;700;800&display=swap');
        :root {
          --indigo:#1A2B4C; --cacao:#E67E22; --cacao-dark:#C96510; --sand:#FDFBF7;
          --cream:#F5EFE0; --text:#1A2B4C; --muted:#7A8699; --line:rgba(26,43,76,0.08);
          --shadow:0 8px 32px rgba(26,43,76,0.10);
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

        /* PAGE BANNER */
        .page-banner{
          background:linear-gradient(105deg,var(--indigo) 0%,#2A3F6B 100%);
          height:180px;display:flex;align-items:center;
          padding:0 2rem;
          position:relative;overflow:hidden;
        }
        .page-banner::after{
          content:'';position:absolute;inset:0;
          background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          pointer-events:none;
        }
        .page-banner-inner{max-width:1200px;width:100%;margin:0 auto;position:relative;z-index:1;}
        .page-banner h1{font-family:'Playfair Display',Georgia,serif;font-size:clamp(1.6rem,4vw,2.4rem);font-weight:700;color:white;margin-bottom:0.35rem;line-height:1.15;}
        .page-banner p{font-size:0.9rem;color:rgba(255,255,255,0.72);font-weight:400;}
        @media(max-width:768px){.page-banner{height:140px;padding:0 1.25rem;}}

        .page{max-width:1200px;margin:0 auto;padding:2.5rem 1.5rem 5rem;}
        .page-header{margin-bottom:2rem;}
        .page-header h1{font-family:'Playfair Display',Georgia,serif;font-size:clamp(1.8rem,4vw,2.4rem);font-weight:800;letter-spacing:-0.02em;color:var(--indigo);margin-bottom:0.3rem;}
        .page-header h1 em{font-style:italic;color:var(--cacao);}
        .page-header p{font-size:0.88rem;color:var(--muted);}
        .layout{display:grid;grid-template-columns:240px 1fr;gap:2rem;}
        @media(max-width:860px){.layout{grid-template-columns:1fr;}.sidebar{display:none;}}
        .sidebar{position:sticky;top:5.5rem;height:fit-content;}
        .sidebar-card{background:white;border:1px solid var(--line);border-radius:20px;padding:1.5rem;box-shadow:var(--shadow);}
        .filter-title{font-size:0.68rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--muted);margin-bottom:0.9rem;font-weight:600;}
        .dest-list{display:flex;flex-direction:column;gap:0.15rem;margin-bottom:1.5rem;}
        .dest-btn{
          display:flex;align-items:center;gap:0.55rem;
          width:100%;padding:0.5rem 0.7rem;border-radius:10px;
          font-size:0.87rem;font-family:'Inter',sans-serif;font-weight:500;
          background:transparent;border:none;color:var(--muted);cursor:pointer;transition:all 0.2s;text-align:left;
        }
        .dest-btn:hover{background:rgba(26,43,76,0.04);color:var(--indigo);}
        .dest-btn.active{background:rgba(230,126,34,0.10);color:var(--cacao);font-weight:600;}
        .dest-compass{font-size:0.72rem;opacity:0.45;flex-shrink:0;transition:opacity 0.2s;}
        .dest-btn.active .dest-compass{opacity:1;color:var(--cacao);}
        .dest-name{flex:1;}
        .dest-dot{width:7px;height:7px;border-radius:50%;background:var(--cacao);opacity:0;transition:opacity 0.2s;flex-shrink:0;}
        .dest-btn.active .dest-dot{opacity:1;}
        .price-display{font-size:1.5rem;font-weight:800;letter-spacing:-0.04em;color:var(--indigo);margin-bottom:0.45rem;}
        .price-display span{font-size:0.78rem;font-weight:400;color:var(--muted);}
        .price-slider-wrap{position:relative;margin-bottom:0.5rem;}
        .price-slider-track{
          position:absolute;top:50%;transform:translateY(-50%);
          left:0;height:4px;border-radius:4px;pointer-events:none;
          background:linear-gradient(to right,var(--cacao) ${sliderPct}%,rgba(26,43,76,0.12) ${sliderPct}%);
          width:100%;
        }
        .price-slider{
          width:100%;appearance:none;-webkit-appearance:none;
          background:transparent;height:20px;cursor:pointer;position:relative;z-index:1;
        }
        .price-slider::-webkit-slider-thumb{
          -webkit-appearance:none;width:18px;height:18px;border-radius:50%;
          background:var(--cacao);border:3px solid white;box-shadow:0 2px 8px rgba(230,126,34,0.3);
          cursor:pointer;
        }
        .price-slider::-moz-range-thumb{
          width:18px;height:18px;border-radius:50%;border:3px solid white;
          background:var(--cacao);box-shadow:0 2px 8px rgba(230,126,34,0.3);cursor:pointer;
        }
        .price-labels{display:flex;justify-content:space-between;font-size:0.7rem;color:var(--muted);}
        .divider-h{height:1px;background:var(--line);margin:1.25rem 0;}
        .sort-opts{display:flex;gap:0.5rem;}
        .sort-btn{flex:1;padding:0.55rem;border-radius:10px;font-size:0.8rem;font-weight:600;font-family:'Inter',sans-serif;cursor:pointer;transition:all 0.2s;border:1px solid var(--line);background:transparent;color:var(--muted);}
        .sort-btn.active{background:var(--indigo);color:white;border-color:var(--indigo);}
        .results-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;}
        .results-count{font-size:0.85rem;color:var(--muted);}
        .results-count strong{color:var(--indigo);font-weight:700;}
        .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:1.5rem;}

        /* PREMIUM CARDS */
        .card{
          background:white;border:1px solid var(--line);border-radius:24px;
          overflow:hidden;text-decoration:none;color:inherit;display:block;
          box-shadow:var(--shadow);transition:all 0.32s ease;
          border-top:3px solid transparent;
        }
        .card:hover{
          transform:translateY(-6px);
          box-shadow:0 24px 52px rgba(26,43,76,0.15);
          border-top-color:var(--cacao);
        }
        .card-img{position:relative;aspect-ratio:3/2;overflow:hidden;border-radius:20px 20px 0 0;}
        .card-img img{width:100%;height:100%;object-fit:cover;transition:transform 0.5s ease;}
        .card:hover .card-img img{transform:scale(1.06);}
        .card-badge{position:absolute;top:0.75rem;left:0.75rem;padding:0.3rem 0.75rem;border-radius:999px;font-size:0.68rem;font-weight:700;background:rgba(230,126,34,0.9);color:white;}
        .card-price{
          position:absolute;bottom:0.75rem;right:0.75rem;
          background:var(--indigo);color:white;
          font-size:0.85rem;font-weight:800;border-radius:999px;padding:0.4rem 0.9rem;
          box-shadow:0 4px 14px rgba(26,43,76,0.25);
        }
        .card-body{padding:1.1rem 1.2rem 1.3rem;}
        .card-name{font-family:'Playfair Display',Georgia,serif;font-size:1.15rem;font-weight:700;color:var(--indigo);margin-bottom:0.3rem;line-height:1.3;}
        .card-meta{display:flex;align-items:center;gap:0.6rem;margin-bottom:0.65rem;}
        .card-rating{font-size:0.82rem;color:var(--cacao);font-weight:700;letter-spacing:0.02em;}
        .card-reviews{font-size:0.74rem;color:var(--muted);}
        .card-rooms{font-size:0.74rem;color:var(--muted);margin-left:auto;}
        .card-tags{display:flex;gap:0.35rem;flex-wrap:wrap;margin-bottom:0.75rem;}
        .tag{font-size:0.68rem;padding:0.22rem 0.55rem;border-radius:999px;border:1px solid rgba(26,43,76,0.09);color:var(--muted);}
        .card-cta{display:block;text-align:right;font-size:0.8rem;font-weight:600;color:var(--cacao);text-decoration:none;}
        .card-cta:hover{color:var(--cacao-dark);}

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

      <div className="page-banner">
        <div className="page-banner-inner">
          <h1>Encuentra tu posada ideal</h1>
          <p>Posadas auténticas en los destinos más especiales de Venezuela</p>
        </div>
      </div>

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
                    <span className="dest-compass">◉</span>
                    <span className="dest-name">{d}</span>
                    <div className="dest-dot" />
                  </button>
                ))}
              </div>
              <div className="divider-h" />
              <div className="filter-title">Precio máximo / noche</div>
              <div className="price-display">${precioMax} <span>USD</span></div>
              <div className="price-slider-wrap">
                <div className="price-slider-track" />
                <input
                  type="range"
                  className="price-slider"
                  min={40}
                  max={200}
                  value={precioMax}
                  onChange={e => setPrecioMax(Number(e.target.value))}
                  step={5}
                />
              </div>
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
                        <span className="card-rating">{renderStars(p.rating)} {p.rating}</span>
                        <span className="card-reviews">({p.reviews} reseñas)</span>
                        <span className="card-rooms">{p.habitaciones} hab.</span>
                      </div>
                      <div className="card-tags">
                        {p.tags.map(t => <span className="tag" key={t}>{t}</span>)}
                      </div>
                      <span className="card-cta">Ver posada →</span>
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
