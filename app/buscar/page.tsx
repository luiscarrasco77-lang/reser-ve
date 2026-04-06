'use client'

import { useState } from 'react'
import Link from 'next/link'

const posadas = [
  {
    slug: 'posada-sol-roques',
    nombre: 'Posada Sol de Los Roques',
    destino: 'Los Roques',
    tipo: 'Archipiélago',
    precio: 120,
    habitaciones: 8,
    rating: 4.9,
    reviews: 47,
    tags: ['Frente al mar', 'Desayuno incluido', 'Snorkel'],
    img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=700&q=80',
  },
  {
    slug: 'posada-los-andes',
    nombre: 'Posada Los Andes de Mérida',
    destino: 'Mérida',
    tipo: 'Los Andes',
    precio: 65,
    habitaciones: 12,
    rating: 4.8,
    reviews: 83,
    tags: ['Vista a la montaña', 'Chimenea', 'Senderismo'],
    img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=700&q=80',
  },
  {
    slug: 'posada-mochima-azul',
    nombre: 'Posada Mochima Azul',
    destino: 'Mochima',
    tipo: 'Costa Oriental',
    precio: 85,
    habitaciones: 6,
    rating: 4.7,
    reviews: 31,
    tags: ['Playa privada', 'Kayak', 'Pesca'],
    img: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=700&q=80',
  },
  {
    slug: 'posada-morrocoy',
    nombre: 'Posada Morrocoy Paradise',
    destino: 'Morrocoy',
    tipo: 'Costa Occidental',
    precio: 95,
    habitaciones: 10,
    rating: 4.6,
    reviews: 58,
    tags: ['Manglar', 'Buceo', 'Puesta de sol'],
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=700&q=80',
  },
  {
    slug: 'posada-canaima',
    nombre: 'Posada Canaima Lodge',
    destino: 'Canaima',
    tipo: 'Gran Sabana',
    precio: 150,
    habitaciones: 5,
    rating: 5.0,
    reviews: 22,
    tags: ['Tepuyes', 'Salto Ángel', 'Todo incluido'],
    img: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=700&q=80',
  },
  {
    slug: 'posada-margarita',
    nombre: 'Posada Isla Bella Margarita',
    destino: 'Isla Margarita',
    tipo: 'Caribe',
    precio: 75,
    habitaciones: 15,
    rating: 4.5,
    reviews: 112,
    tags: ['Piscina', 'Beach bar', 'Kitesurf'],
    img: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=700&q=80',
  },
]

const destinos = ['Todos', 'Los Roques', 'Mérida', 'Mochima', 'Morrocoy', 'Canaima', 'Isla Margarita']

export default function Buscar() {
  const [destino, setDestino] = useState('Todos')
  const [precioMax, setPrecioMax] = useState(200)
  const [orden, setOrden] = useState('rating')

  const filtradas = posadas
    .filter(p => destino === 'Todos' || p.destino === destino)
    .filter(p => p.precio <= precioMax)
    .sort((a, b) => orden === 'precio' ? a.precio - b.precio : b.rating - a.rating)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'DM Sans',sans-serif; background:#0A0A08; color:#F5F0E8; }
        .serif { font-family:'Cormorant Garamond',serif; }

        .nav {
          display:flex; align-items:center; justify-content:space-between;
          padding:1.25rem 2.5rem; border-bottom:0.5px solid rgba(245,240,232,0.08);
          position:sticky; top:0; background:rgba(10,10,8,0.92);
          backdrop-filter:blur(20px); z-index:50;
        }
        .logo { font-family:'Cormorant Garamond',serif; font-size:1.4rem; font-weight:300; letter-spacing:0.15em; color:#F5F0E8; text-decoration:none; }
        .logo span { color:#D4A853; }

        .page { max-width:1200px; margin:0 auto; padding:3rem 2rem; }

        .page-header { margin-bottom:2.5rem; }
        .page-header h1 { font-family:'Cormorant Garamond',serif; font-size:2.8rem; font-weight:300; letter-spacing:-0.02em; margin-bottom:0.4rem; }
        .page-header h1 em { font-style:italic; color:#D4A853; }
        .page-header p { font-size:0.85rem; color:rgba(245,240,232,0.45); }

        .layout { display:grid; grid-template-columns:240px 1fr; gap:2.5rem; }
        @media(max-width:768px) { .layout { grid-template-columns:1fr; } }

        /* SIDEBAR */
        .sidebar { position:sticky; top:6rem; height:fit-content; }
        .filter-group { margin-bottom:2rem; }
        .filter-label { font-size:0.65rem; letter-spacing:0.2em; text-transform:uppercase; color:#D4A853; margin-bottom:1rem; display:block; }

        .dest-btn {
          display:block; width:100%; text-align:left;
          padding:0.55rem 0.75rem; font-size:0.8rem; font-family:'DM Sans',sans-serif;
          background:transparent; border:0.5px solid transparent;
          color:rgba(245,240,232,0.5); cursor:pointer; transition:all 0.25s ease;
          margin-bottom:0.25rem;
        }
        .dest-btn:hover { color:#F5F0E8; border-color:rgba(245,240,232,0.12); }
        .dest-btn.active { color:#D4A853; border-color:rgba(212,168,83,0.3); background:rgba(212,168,83,0.05); }

        .price-range { width:100%; accent-color:#D4A853; }
        .price-val { font-size:1.4rem; font-family:'Cormorant Garamond',serif; font-weight:300; color:#F5F0E8; margin-bottom:0.5rem; }
        .price-val span { font-size:0.75rem; font-family:'DM Sans',sans-serif; color:rgba(245,240,232,0.4); }

        .sort-btn {
          padding:0.45rem 1rem; font-size:0.7rem; letter-spacing:0.08em; text-transform:uppercase;
          background:transparent; border:0.5px solid rgba(245,240,232,0.15);
          color:rgba(245,240,232,0.5); cursor:pointer; font-family:'DM Sans',sans-serif;
          transition:all 0.25s ease; margin-right:0.5rem; margin-bottom:0.5rem;
        }
        .sort-btn.active { border-color:#D4A853; color:#D4A853; background:rgba(212,168,83,0.05); }

        /* RESULTS */
        .results-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem; }
        .results-count { font-size:0.8rem; color:rgba(245,240,232,0.4); }
        .results-count strong { color:#F5F0E8; font-weight:500; }

        .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(280px,1fr)); gap:1.25rem; }

        .card {
          background:rgba(245,240,232,0.03); border:0.5px solid rgba(245,240,232,0.08);
          overflow:hidden; transition:all 0.4s cubic-bezier(0.16,1,0.3,1); cursor:pointer;
          text-decoration:none; display:block; color:inherit;
        }
        .card:hover { border-color:rgba(212,168,83,0.25); transform:translateY(-3px); background:rgba(245,240,232,0.05); }

        .card-img { position:relative; aspect-ratio:16/10; overflow:hidden; }
        .card-img img { width:100%; height:100%; object-fit:cover; filter:brightness(0.8) saturate(1.1); transition:transform 0.6s cubic-bezier(0.16,1,0.3,1); }
        .card:hover .card-img img { transform:scale(1.05); }
        .card-badge {
          position:absolute; top:0.75rem; left:0.75rem;
          font-size:0.6rem; letter-spacing:0.12em; text-transform:uppercase;
          padding:0.3rem 0.7rem; background:rgba(10,10,8,0.7);
          color:#D4A853; backdrop-filter:blur(8px); border:0.5px solid rgba(212,168,83,0.3);
        }
        .card-price {
          position:absolute; bottom:0.75rem; right:0.75rem;
          font-family:'Cormorant Garamond',serif; font-size:1.4rem; font-weight:300;
          color:#F5F0E8; background:rgba(10,10,8,0.75); padding:0.2rem 0.6rem;
          backdrop-filter:blur(8px);
        }
        .card-price span { font-size:0.7rem; font-family:'DM Sans',sans-serif; color:rgba(245,240,232,0.6); }

        .card-body { padding:1.1rem 1.25rem; }
        .card-name { font-family:'Cormorant Garamond',serif; font-size:1.2rem; font-weight:400; margin-bottom:0.35rem; line-height:1.2; }
        .card-meta { display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem; }
        .card-rating { font-size:0.75rem; color:#D4A853; }
        .card-reviews { font-size:0.72rem; color:rgba(245,240,232,0.35); }
        .card-rooms { font-size:0.72rem; color:rgba(245,240,232,0.35); margin-left:auto; }
        .card-tags { display:flex; gap:0.4rem; flex-wrap:wrap; }
        .tag {
          font-size:0.6rem; letter-spacing:0.06em; padding:0.25rem 0.6rem;
          border:0.5px solid rgba(245,240,232,0.12); color:rgba(245,240,232,0.45);
        }

        .empty { text-align:center; padding:4rem 2rem; color:rgba(245,240,232,0.3); }
        .empty p { font-family:'Cormorant Garamond',serif; font-size:1.5rem; font-weight:300; }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <Link href="/" className="logo">RESER<span>-VE</span></Link>
        <div style={{display:'flex', gap:'2rem', alignItems:'center'}}>
          <span style={{fontSize:'0.75rem', color:'rgba(245,240,232,0.4)'}}>
            {filtradas.length} posadas encontradas
          </span>
          <Link href="/registro-posada" style={{fontSize:'0.7rem', letterSpacing:'0.1em', textTransform:'uppercase', padding:'0.55rem 1.2rem', border:'0.5px solid rgba(212,168,83,0.4)', color:'#D4A853', textDecoration:'none'}}>
            Registra tu posada
          </Link>
        </div>
      </nav>

      <div className="page">
        <div className="page-header">
          <h1>Posadas en <em>{destino === 'Todos' ? 'Venezuela' : destino}</em></h1>
          <p>{filtradas.length} alojamientos disponibles · Precios en USD por noche</p>
        </div>

        <div className="layout">
          {/* SIDEBAR */}
          <aside className="sidebar">
            <div className="filter-group">
              <span className="filter-label">Destino</span>
              {destinos.map(d => (
                <button key={d} className={`dest-btn ${destino === d ? 'active' : ''}`} onClick={() => setDestino(d)}>
                  {d}
                </button>
              ))}
            </div>

            <div className="filter-group">
              <span className="filter-label">Precio máximo / noche</span>
              <div className="price-val">${precioMax} <span>USD</span></div>
              <input type="range" className="price-range" min={40} max={200} value={precioMax} onChange={e => setPrecioMax(Number(e.target.value))} step={5} />
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.65rem', color:'rgba(245,240,232,0.3)', marginTop:'0.4rem'}}>
                <span>$40</span><span>$200</span>
              </div>
            </div>

            <div className="filter-group">
              <span className="filter-label">Ordenar por</span>
              <button className={`sort-btn ${orden === 'rating' ? 'active' : ''}`} onClick={() => setOrden('rating')}>Valoración</button>
              <button className={`sort-btn ${orden === 'precio' ? 'active' : ''}`} onClick={() => setOrden('precio')}>Precio</button>
            </div>
          </aside>

          {/* RESULTADOS */}
          <main>
            <div className="results-header">
              <p className="results-count"><strong>{filtradas.length}</strong> posadas encontradas</p>
            </div>

            {filtradas.length === 0 ? (
              <div className="empty"><p>No hay posadas con estos filtros</p></div>
            ) : (
              <div className="grid">
                {filtradas.map(p => (
                  <Link href={`/posadas/${p.slug}`} className="card" key={p.slug}>
                    <div className="card-img">
                      <img src={p.img} alt={p.nombre} />
                      <div className="card-badge">{p.tipo}</div>
                      <div className="card-price">${p.precio} <span>/ noche</span></div>
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