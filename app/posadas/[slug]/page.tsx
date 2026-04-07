'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { getPosada } from '@/lib/data'

export default function FichaPosada() {
  const rawParams = useParams<{ slug: string }>()
  const slug = rawParams?.slug ?? ''
  const posada = getPosada(slug)
  const router = useRouter()
  const [imgActiva, setImgActiva] = useState(0)
  const [fechaEntrada, setFechaEntrada] = useState('')
  const [fechaSalida, setFechaSalida] = useState('')
  const [huespedes, setHuespedes] = useState(2)

  if (!rawParams) return null

  if (!posada) {
    return (
      <div style={{minHeight:'100vh',background:'#FDFBF7',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'Inter,sans-serif',color:'#1A2B4C',gap:'1rem'}}>
        <p style={{fontSize:'1.2rem',fontWeight:700}}>Posada no encontrada</p>
        <Link href="/buscar" style={{color:'#E67E22',textDecoration:'none',fontSize:'0.9rem'}}>← Volver a búsqueda</Link>
      </div>
    )
  }

  const noches = fechaEntrada && fechaSalida
    ? Math.max(0, Math.round((new Date(fechaSalida).getTime() - new Date(fechaEntrada).getTime()) / 86400000))
    : 0

  const handleReservar = () => {
    const qs = new URLSearchParams()
    if (fechaEntrada) qs.set('llegada', fechaEntrada)
    if (fechaSalida) qs.set('salida', fechaSalida)
    qs.set('huespedes', String(huespedes))
    router.push(`/reservar/${slug}?${qs.toString()}`)
  }

  const isSuperhost = posada.rating >= 4.7

  const renderStars = (rating: number) => {
    return Array.from({length: 5}, (_, i) => (
      <span key={i} style={{color: i < rating ? 'var(--cacao)' : 'rgba(26,43,76,0.15)', fontSize:'1rem'}}>★</span>
    ))
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,700&family=Inter:wght@300;400;500;600;700;800&display=swap');
        :root{--indigo:#1A2B4C;--cacao:#E67E22;--cacao-dark:#C96510;--sand:#FDFBF7;--cream:#F5EFE0;--text:#1A2B4C;--muted:#7A8699;--line:rgba(26,43,76,0.08);}
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Inter',sans-serif;background:radial-gradient(circle at top left,rgba(230,126,34,0.05) 0%,transparent 30%),linear-gradient(180deg,#fffefb 0%,var(--sand) 100%);color:var(--text);}
        .grain{position:fixed;inset:0;pointer-events:none;z-index:100;opacity:0.018;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");}
        .nav{position:sticky;top:0;z-index:60;display:flex;align-items:center;justify-content:space-between;padding:1rem 2rem;background:rgba(253,251,247,0.92);backdrop-filter:blur(18px);border-bottom:1px solid var(--line);box-shadow:0 4px 20px rgba(26,43,76,0.05);}
        .logo{font-size:1.6rem;font-weight:800;letter-spacing:-0.04em;color:var(--indigo);text-decoration:none;}
        .logo span{color:var(--cacao);}
        .nav-back{font-size:0.85rem;color:var(--muted);text-decoration:none;font-weight:500;display:flex;align-items:center;gap:0.4rem;transition:color 0.2s;}
        .nav-back:hover{color:var(--indigo);}
        .page{max-width:1100px;margin:0 auto;padding:2rem 1.5rem 6rem;}
        .breadcrumb{font-size:0.8rem;color:var(--muted);margin-bottom:1.5rem;display:flex;align-items:center;gap:0.5rem;}
        .breadcrumb a{color:var(--muted);text-decoration:none;transition:color 0.2s;}
        .breadcrumb a:hover{color:var(--indigo);}
        .breadcrumb span{color:var(--cacao);font-weight:600;}

        /* GALLERY — full-width featured + 3 thumbs row */
        .gallery{border-radius:24px;overflow:hidden;margin-bottom:2.5rem;}
        .gallery-main{width:100%;height:480px;overflow:hidden;cursor:pointer;position:relative;}
        .gallery-main img{width:100%;height:100%;object-fit:cover;transition:transform 0.5s ease;}
        .gallery-main:hover img{transform:scale(1.03);}
        .gallery-thumbs{display:flex;flex-direction:row;gap:0.5rem;margin-top:0.5rem;}
        .gallery-thumb{flex:1;height:140px;overflow:hidden;cursor:pointer;position:relative;border-radius:14px;}
        .gallery-thumb img{width:100%;height:100%;object-fit:cover;transition:all 0.4s ease;filter:brightness(0.88);}
        .gallery-thumb:hover img{filter:brightness(1);transform:scale(1.04);}
        .gallery-thumb.active img{filter:brightness(1);}
        .gallery-thumb.active{outline:3px solid var(--cacao);outline-offset:2px;}
        @media(max-width:768px){
          .gallery-main{height:280px;}
          .gallery-thumbs{gap:0.35rem;}
          .gallery-thumb{height:100px;}
        }

        .layout{display:grid;grid-template-columns:1fr 340px;gap:3rem;align-items:start;}
        @media(max-width:900px){.layout{grid-template-columns:1fr;}}

        /* LEFT */
        .ficha-tipo{font-size:0.72rem;letter-spacing:0.16em;text-transform:uppercase;color:var(--cacao);font-weight:700;margin-bottom:0.6rem;}
        .ficha-nombre{font-family:'Playfair Display',Georgia,serif;font-size:clamp(2rem,5vw,3rem);font-weight:700;letter-spacing:-0.02em;color:var(--indigo);margin-bottom:0.75rem;line-height:1.1;}
        .ficha-meta{display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap;}
        .ficha-rating{font-size:0.88rem;color:var(--cacao);font-weight:700;}
        .ficha-reviews{font-size:0.82rem;color:var(--muted);}
        .ficha-hab{font-size:0.82rem;color:var(--muted);padding-left:1rem;border-left:1px solid var(--line);}
        hr{border:none;border-top:1px solid var(--line);margin:1.75rem 0;}
        .section-label{font-size:0.7rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--cacao);font-weight:700;margin-bottom:0.9rem;}
        .descripcion{font-size:0.94rem;line-height:1.85;color:var(--muted);margin-bottom:1.5rem;}

        /* SERVICIOS — pill chips */
        .servicios-grid{display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1.5rem;}
        .servicio{display:inline-flex;align-items:center;gap:0.5rem;padding:0.5rem 1rem;background:rgba(26,43,76,0.04);border:1px solid var(--line);border-radius:999px;font-size:0.82rem;color:var(--text);cursor:default;transition:background 0.2s,border-color 0.2s;}
        .servicio:hover{background:rgba(230,126,34,0.06);border-color:rgba(230,126,34,0.2);}
        .servicio-dot{width:6px;height:6px;border-radius:50%;background:var(--cacao);flex-shrink:0;}

        /* HOST CARD */
        .host-card{display:flex;align-items:flex-start;gap:1.25rem;padding:1.25rem;background:white;border:1px solid var(--line);border-radius:20px;box-shadow:0 8px 32px rgba(26,43,76,0.10);margin-bottom:1.5rem;}
        .host-avatar{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--cacao),var(--cacao-dark));display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:800;color:white;flex-shrink:0;font-family:'Playfair Display',serif;}
        .host-nombre-wrap{display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.25rem;}
        .host-nombre{font-size:0.95rem;font-weight:700;color:var(--indigo);}
        .host-badge{font-size:0.65rem;padding:0.2rem 0.55rem;border-radius:999px;background:linear-gradient(135deg,rgba(230,126,34,0.15),rgba(230,126,34,0.08));color:var(--cacao);font-weight:700;letter-spacing:0.04em;border:1px solid rgba(230,126,34,0.2);}
        .host-meta{font-size:0.8rem;color:var(--muted);line-height:1.7;}
        .politicas{display:flex;flex-direction:column;gap:0.5rem;margin-bottom:1.5rem;}
        .politica{font-size:0.85rem;color:var(--text);display:flex;gap:0.75rem;align-items:flex-start;padding:0.55rem 0;border-bottom:1px solid rgba(26,43,76,0.05);}
        .politica::before{content:'→';color:var(--cacao);flex-shrink:0;font-size:0.8rem;margin-top:0.05rem;}

        /* REVIEWS — 2-col grid */
        .reseñas{display:grid;grid-template-columns:1fr 1fr;gap:1rem;}
        @media(max-width:640px){.reseñas{grid-template-columns:1fr;}}
        .reseña{padding:1.25rem;background:white;border:1px solid var(--line);border-radius:16px;box-shadow:0 2px 10px rgba(26,43,76,0.04);}
        .reseña-quote{font-size:3rem;color:rgba(230,126,34,0.1);line-height:0.8;margin-bottom:0.5rem;font-family:'Playfair Display',serif;}
        .reseña-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:0.6rem;}
        .reseña-autor{font-size:0.88rem;font-weight:700;color:var(--indigo);}
        .reseña-pais{font-size:0.75rem;color:var(--muted);}
        .reseña-stars{display:flex;gap:1px;margin-bottom:0.1rem;}
        .reseña-texto{font-size:0.85rem;color:var(--muted);line-height:1.7;font-style:italic;}

        /* BOOKING CARD */
        .booking-card{position:sticky;top:5.5rem;background:linear-gradient(180deg,white 0%,rgba(253,251,247,0.5) 100%);border:1px solid var(--line);border-radius:24px;padding:1.75rem;box-shadow:0 8px 32px rgba(26,43,76,0.10);}
        .booking-precio{font-family:'Playfair Display',serif;font-size:2.4rem;font-weight:700;letter-spacing:-0.03em;color:var(--indigo);margin-bottom:0.2rem;line-height:1;}
        .booking-precio span{font-family:'Inter',sans-serif;font-size:0.82rem;font-weight:400;color:var(--muted);}
        .booking-rating{font-size:0.8rem;color:var(--muted);margin-bottom:1.25rem;}
        .booking-rating strong{color:var(--cacao);}
        .booking-fields{border:1px solid var(--line);border-radius:14px;overflow:hidden;margin-bottom:0.75rem;}
        .booking-row{display:grid;grid-template-columns:1fr 1fr;}
        .booking-field{padding:0.75rem 1rem;}
        .booking-field:first-child{border-right:1px solid var(--line);}
        .booking-field label{display:block;font-size:0.62rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--cacao);font-weight:700;margin-bottom:0.3rem;}
        .booking-field input,.booking-field select{background:transparent;border:none;outline:none;font-family:'Inter',sans-serif;font-size:0.85rem;color:var(--text);width:100%;font-weight:500;}
        .booking-huespedes{border:1px solid var(--line);border-radius:14px;padding:0.75rem 1rem;margin-bottom:1.1rem;}
        .booking-huespedes label{display:block;font-size:0.62rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--cacao);font-weight:700;margin-bottom:0.3rem;}
        .booking-huespedes select{background:transparent;border:none;outline:none;font-family:'Inter',sans-serif;font-size:0.85rem;color:var(--text);width:100%;font-weight:500;}
        .btn-reservar{width:100%;padding:1.1rem;background:var(--cacao);color:white;font-size:0.9rem;font-weight:700;border:none;border-radius:999px;cursor:pointer;font-family:'Inter',sans-serif;box-shadow:0 10px 28px rgba(230,126,34,0.28);transition:all 0.22s;margin-bottom:0.65rem;display:flex;align-items:center;justify-content:center;gap:0.5rem;}
        .btn-reservar:hover{background:var(--cacao-dark);transform:translateY(-1px);}
        .btn-reservar-arrow{margin-left:auto;font-size:1rem;}
        .btn-protegida{display:flex;align-items:center;justify-content:center;gap:0.4rem;font-size:0.72rem;color:var(--muted);margin-bottom:0.75rem;line-height:1.5;}
        .btn-whatsapp{width:100%;padding:0.85rem;background:transparent;border:1px solid var(--line);color:var(--indigo);font-size:0.82rem;font-weight:600;border-radius:999px;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.22s;}
        .btn-whatsapp:hover{border-color:var(--indigo);background:rgba(26,43,76,0.03);}
        .booking-desglose{border-top:1px solid var(--line);padding-top:1rem;margin-top:1rem;}
        .booking-linea{display:flex;justify-content:space-between;font-size:0.82rem;color:var(--muted);margin-bottom:0.45rem;}
        .booking-total{display:flex;justify-content:space-between;font-size:0.95rem;font-weight:800;color:var(--indigo);border-top:1px solid var(--line);padding-top:0.75rem;margin-top:0.5rem;}
        .booking-nota{font-size:0.72rem;color:var(--muted);text-align:center;margin-top:0.85rem;line-height:1.6;}
        .booking-badges{display:flex;gap:0.5rem;justify-content:center;margin-top:0.75rem;flex-wrap:wrap;}
        .booking-badge{font-size:0.65rem;padding:0.25rem 0.55rem;border-radius:999px;border:1px solid var(--line);color:var(--muted);}
      `}</style>
      <div className="grain" />
      <nav className="nav">
        <Link href="/" className="logo">RESER<span>-VE</span></Link>
        <Link href="/buscar" className="nav-back">← Volver a búsqueda</Link>
      </nav>
      <div className="page">
        <div className="breadcrumb">
          <Link href="/">Inicio</Link> /
          <Link href="/buscar">Posadas</Link> /
          <span>{posada.destino}</span>
        </div>

        {/* GALLERY: full-width featured + 3 thumbs row */}
        <div className="gallery">
          <div className="gallery-main" onClick={() => setImgActiva(0)}>
            <img src={posada.imgs[imgActiva]} alt={posada.nombre} />
          </div>
          <div className="gallery-thumbs">
            {posada.imgs.slice(0, 3).map((img, i) => (
              <div
                key={i}
                className={`gallery-thumb ${imgActiva === i ? 'active' : ''}`}
                onClick={() => setImgActiva(i)}
              >
                <img src={img} alt={`${posada.nombre} ${i + 1}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="layout">
          <div>
            <div className="ficha-tipo">{posada.tipo}</div>
            <h1 className="ficha-nombre">{posada.nombre}</h1>
            <div className="ficha-meta">
              <span className="ficha-rating">★ {posada.rating}</span>
              <span className="ficha-reviews">{posada.reviews} reseñas</span>
              <span className="ficha-hab">{posada.habitaciones} habitaciones</span>
            </div>
            <hr />
            <div className="section-label">Sobre esta posada</div>
            <p className="descripcion">{posada.descripcion}</p>
            <div className="section-label">Servicios incluidos</div>
            <div className="servicios-grid">
              {posada.servicios.map(s => (
                <div className="servicio" key={s}>
                  <span className="servicio-dot" />
                  {s}
                </div>
              ))}
            </div>
            <hr />
            <div className="section-label">Tu anfitrión</div>
            <div className="host-card">
              <div className="host-avatar">{posada.host.nombre[0]}</div>
              <div>
                <div className="host-nombre-wrap">
                  <div className="host-nombre">{posada.host.nombre}</div>
                  {isSuperhost && <span className="host-badge">Superposadero</span>}
                </div>
                <div className="host-meta">
                  Posadero desde {posada.host.desde} · Idiomas: {posada.host.idiomas.join(', ')}
                </div>
              </div>
            </div>
            <div className="section-label">Políticas de la posada</div>
            <div className="politicas">
              {posada.politicas.map(p => <div className="politica" key={p}>{p}</div>)}
            </div>
            {posada.reseñas.length > 0 && (
              <>
                <hr />
                <div className="section-label">Reseñas · ★ {posada.rating} · {posada.reviews} opiniones</div>
                <div className="reseñas">
                  {posada.reseñas.map((r, i) => (
                    <div className="reseña" key={i}>
                      <div className="reseña-quote">"</div>
                      <div className="reseña-header">
                        <div>
                          <div className="reseña-autor">{r.autor}</div>
                          <div className="reseña-pais">{r.pais}</div>
                        </div>
                        <div className="reseña-stars">
                          {renderStars(r.rating)}
                        </div>
                      </div>
                      <p className="reseña-texto">"{r.texto}"</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div>
            <div className="booking-card">
              <div className="booking-precio">${posada.precio} <span>USD / noche</span></div>
              <div className="booking-rating"><strong>★ {posada.rating}</strong> · {posada.reviews} reseñas</div>
              <div className="booking-fields">
                <div className="booking-row">
                  <div className="booking-field">
                    <label>Llegada</label>
                    <input type="date" value={fechaEntrada} onChange={e => setFechaEntrada(e.target.value)} />
                  </div>
                  <div className="booking-field">
                    <label>Salida</label>
                    <input type="date" value={fechaSalida} onChange={e => setFechaSalida(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="booking-huespedes">
                <label>Huéspedes</label>
                <select value={huespedes} onChange={e => setHuespedes(Number(e.target.value))}>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'huésped' : 'huéspedes'}</option>)}
                </select>
              </div>
              <button className="btn-reservar" onClick={handleReservar}>
                <span>{noches > 0 ? `Reservar · ${noches} noche${noches > 1 ? 's' : ''}` : 'Reservar ahora'}</span>
                <span className="btn-reservar-arrow">→</span>
              </button>
              <div className="btn-protegida">
                <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 0.5L1 2.5V6.5C1 9.5 3.2 12.3 6 13C8.8 12.3 11 9.5 11 6.5V2.5L6 0.5Z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                  <path d="M4 7L5.5 8.5L8 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Reserva protegida · Sin cobro automático
              </div>
              <button className="btn-whatsapp">Consultar por WhatsApp</button>
              {noches > 0 && (
                <div className="booking-desglose">
                  <div className="booking-linea">
                    <span>${posada.precio} × {noches} noche{noches > 1 ? 's' : ''}</span>
                    <span>${posada.precio * noches}</span>
                  </div>
                  <div className="booking-linea">
                    <span>Comisión RESER-VE (10%)</span>
                    <span>${Math.round(posada.precio * noches * 0.1)}</span>
                  </div>
                  <div className="booking-total">
                    <span>Total</span>
                    <span>${Math.round(posada.precio * noches * 1.1)} USD</span>
                  </div>
                </div>
              )}
              <p className="booking-nota">Sin cargos hasta confirmar. El posadero acepta en 24h.</p>
              <div className="booking-badges">
                <span className="booking-badge">Zelle</span>
                <span className="booking-badge">Zinli</span>
                <span className="booking-badge">Pago Móvil</span>
                <span className="booking-badge">Tarjeta</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
