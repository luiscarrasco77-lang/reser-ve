'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getPosada } from '@/lib/data'

const defaultPosada = {
  nombre: 'Posada en Venezuela',
  destino: 'Venezuela',
  destinoSlug: '',
  tipo: 'Alojamiento',
  precio: 80,
  habitaciones: 6,
  rating: 4.7,
  reviews: 25,
  descripcion: 'Una hermosa posada venezolana con todo lo que necesitas para una estadía memorable.',
  servicios: ['Wi-Fi', 'Desayuno', 'Aire acondicionado'],
  politicas: ['Check-in: 2:00 PM', 'Check-out: 11:00 AM'],
  imgs: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80'],
  host: { nombre: 'Anfitrión Local', desde: '2020', idiomas: ['Español'] },
  reseñas: [],
}

export default function FichaPosada({ params }: { params: { slug: string } }) {
  const posada = getPosada(params.slug) || defaultPosada
  const router = useRouter()
  const [imgActiva, setImgActiva] = useState(0)
  const [fechaEntrada, setFechaEntrada] = useState('')
  const [fechaSalida, setFechaSalida] = useState('')
  const [huespedes, setHuespedes] = useState(2)

  const noches = fechaEntrada && fechaSalida
    ? Math.max(0, Math.round((new Date(fechaSalida).getTime() - new Date(fechaEntrada).getTime()) / 86400000))
    : 0

  const handleReservar = () => {
    const qs = new URLSearchParams()
    if (fechaEntrada) qs.set('llegada', fechaEntrada)
    if (fechaSalida) qs.set('salida', fechaSalida)
    qs.set('huespedes', String(huespedes))
    router.push(`/reservar/${params.slug}?${qs.toString()}`)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'DM Sans',sans-serif; background:#0A0A08; color:#F5F0E8; }

        .nav {
          display:flex; align-items:center; justify-content:space-between;
          padding:1.25rem 2.5rem; border-bottom:0.5px solid rgba(245,240,232,0.08);
          position:sticky; top:0; background:rgba(10,10,8,0.92);
          backdrop-filter:blur(20px); z-index:50;
        }
        .logo { font-family:'Cormorant Garamond',serif; font-size:1.4rem; font-weight:300; letter-spacing:0.15em; color:#F5F0E8; text-decoration:none; }
        .logo span { color:#D4A853; }
        .nav-back { font-size:0.72rem; color:rgba(245,240,232,0.45); text-decoration:none; letter-spacing:0.08em; display:flex; align-items:center; gap:0.4rem; transition:color 0.3s; }
        .nav-back:hover { color:#F5F0E8; }

        .page { max-width:1100px; margin:0 auto; padding:2.5rem 2rem 5rem; }

        .gallery { display:grid; grid-template-columns:1fr 1fr; grid-template-rows:340px 160px; gap:0.6rem; margin-bottom:3rem; border-radius:0; overflow:hidden; }
        .gallery-main { grid-row:1/3; grid-column:1/2; position:relative; overflow:hidden; cursor:pointer; }
        .gallery-main img { width:100%; height:100%; object-fit:cover; filter:brightness(0.85); transition:transform 0.6s ease; }
        .gallery-main:hover img { transform:scale(1.03); }
        .gallery-thumb { position:relative; overflow:hidden; cursor:pointer; }
        .gallery-thumb img { width:100%; height:100%; object-fit:cover; filter:brightness(0.75); transition:all 0.4s ease; }
        .gallery-thumb:hover img { filter:brightness(0.9); transform:scale(1.04); }
        .gallery-thumb.active img { filter:brightness(0.95); }

        .layout { display:grid; grid-template-columns:1fr 340px; gap:3rem; }
        @media(max-width:900px) { .layout { grid-template-columns:1fr; } .gallery { grid-template-columns:1fr; grid-template-rows:300px 120px 120px; } .gallery-main { grid-row:1/2; } }

        .ficha-left {}
        .breadcrumb { font-size:0.7rem; color:rgba(245,240,232,0.35); margin-bottom:1rem; letter-spacing:0.05em; }
        .breadcrumb span { color:#D4A853; }
        .ficha-tipo { font-size:0.65rem; letter-spacing:0.2em; text-transform:uppercase; color:#D4A853; margin-bottom:0.75rem; display:flex; align-items:center; gap:0.5rem; }
        .ficha-tipo::before { content:''; width:1.2rem; height:0.5px; background:#D4A853; opacity:0.6; }
        .ficha-nombre { font-family:'Cormorant Garamond',serif; font-size:2.8rem; font-weight:300; line-height:1.1; letter-spacing:-0.02em; margin-bottom:1rem; }
        .ficha-meta { display:flex; align-items:center; gap:1.5rem; margin-bottom:2rem; flex-wrap:wrap; }
        .ficha-rating { font-size:0.85rem; color:#D4A853; }
        .ficha-reviews { font-size:0.8rem; color:rgba(245,240,232,0.4); }
        .ficha-hab { font-size:0.8rem; color:rgba(245,240,232,0.4); padding-left:1.5rem; border-left:0.5px solid rgba(245,240,232,0.12); }

        .section-label { font-size:0.65rem; letter-spacing:0.2em; text-transform:uppercase; color:#D4A853; margin-bottom:1rem; display:flex; align-items:center; gap:0.6rem; }
        .section-label::before { content:''; width:1rem; height:0.5px; background:#D4A853; opacity:0.6; }

        .descripcion { font-size:0.9rem; line-height:1.9; color:rgba(245,240,232,0.65); margin-bottom:3rem; }

        .servicios-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:0.6rem; margin-bottom:3rem; }
        .servicio { padding:0.65rem 0.9rem; border:0.5px solid rgba(245,240,232,0.08); font-size:0.78rem; color:rgba(245,240,232,0.55); display:flex; align-items:center; gap:0.5rem; }
        .servicio::before { content:''; width:4px; height:4px; border-radius:50%; background:#D4A853; flex-shrink:0; }

        .host-card { display:flex; align-items:flex-start; gap:1.25rem; padding:1.5rem; border:0.5px solid rgba(245,240,232,0.08); margin-bottom:3rem; }
        .host-avatar { width:52px; height:52px; border-radius:50%; background:rgba(212,168,83,0.15); border:0.5px solid rgba(212,168,83,0.3); display:flex; align-items:center; justify-content:center; font-family:'Cormorant Garamond',serif; font-size:1.4rem; color:#D4A853; flex-shrink:0; }
        .host-nombre { font-size:0.9rem; font-weight:500; color:#F5F0E8; margin-bottom:0.3rem; }
        .host-meta { font-size:0.75rem; color:rgba(245,240,232,0.4); line-height:1.7; }

        .politicas { display:flex; flex-direction:column; gap:0.6rem; margin-bottom:3rem; }
        .politica { font-size:0.8rem; color:rgba(245,240,232,0.5); display:flex; gap:0.75rem; align-items:flex-start; }
        .politica::before { content:'—'; color:#D4A853; flex-shrink:0; font-size:0.75rem; }

        .reseñas { display:flex; flex-direction:column; gap:1.25rem; }
        .reseña { padding:1.25rem 1.5rem; border:0.5px solid rgba(245,240,232,0.07); }
        .reseña-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.6rem; }
        .reseña-autor { font-size:0.82rem; font-weight:500; color:#F5F0E8; }
        .reseña-pais { font-size:0.72rem; color:rgba(245,240,232,0.35); }
        .reseña-rating { font-size:0.75rem; color:#D4A853; }
        .reseña-texto { font-size:0.82rem; color:rgba(245,240,232,0.55); line-height:1.7; font-style:italic; }

        /* BOOKING CARD */
        .booking-card { position:sticky; top:6rem; border:0.5px solid rgba(212,168,83,0.2); padding:2rem; background:rgba(212,168,83,0.03); }
        .booking-precio { font-family:'Cormorant Garamond',serif; font-size:2.4rem; font-weight:300; color:#F5F0E8; margin-bottom:0.25rem; }
        .booking-precio span { font-size:0.8rem; font-family:'DM Sans',sans-serif; color:rgba(245,240,232,0.4); }
        .booking-rating { font-size:0.75rem; color:#D4A853; margin-bottom:1.5rem; }

        .booking-fields { display:grid; grid-template-columns:1fr 1fr; gap:0; border:0.5px solid rgba(245,240,232,0.12); margin-bottom:0.75rem; }
        .booking-field { padding:0.75rem 1rem; }
        .booking-field:first-child { border-right:0.5px solid rgba(245,240,232,0.12); }
        .booking-field label { display:block; font-size:0.6rem; letter-spacing:0.15em; text-transform:uppercase; color:#D4A853; margin-bottom:0.4rem; }
        .booking-field input, .booking-field select {
          background:transparent; border:none; outline:none;
          font-family:'DM Sans',sans-serif; font-size:0.82rem; color:#F5F0E8; width:100%;
        }
        .booking-field input[type="date"]::-webkit-calendar-picker-indicator { filter:invert(1) opacity(0.4); }
        .booking-huespedes { border:0.5px solid rgba(245,240,232,0.12); margin-bottom:1.25rem; }

        .btn-reservar {
          width:100%; padding:1rem; background:#D4A853; color:#0A0A08;
          font-size:0.78rem; letter-spacing:0.15em; text-transform:uppercase;
          border:none; cursor:pointer; font-family:'DM Sans',sans-serif; font-weight:500;
          transition:all 0.3s ease; margin-bottom:1rem;
        }
        .btn-reservar:hover { background:#E8BC6A; }
        .btn-whatsapp {
          width:100%; padding:0.85rem; background:transparent;
          border:0.5px solid rgba(245,240,232,0.15); color:rgba(245,240,232,0.6);
          font-size:0.72rem; letter-spacing:0.1em; text-transform:uppercase;
          cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.3s ease;
        }
        .btn-whatsapp:hover { border-color:rgba(245,240,232,0.4); color:#F5F0E8; }

        .booking-desglose { border-top:0.5px solid rgba(245,240,232,0.08); padding-top:1rem; margin-top:1rem; }
        .booking-linea { display:flex; justify-content:space-between; font-size:0.78rem; color:rgba(245,240,232,0.45); margin-bottom:0.5rem; }
        .booking-total { display:flex; justify-content:space-between; font-size:0.88rem; color:#F5F0E8; font-weight:500; border-top:0.5px solid rgba(245,240,232,0.1); padding-top:0.75rem; margin-top:0.5rem; }
        .booking-nota { font-size:0.65rem; color:rgba(245,240,232,0.25); text-align:center; margin-top:0.75rem; line-height:1.6; }

        hr { border:none; border-top:0.5px solid rgba(245,240,232,0.07); margin:2.5rem 0; }
      `}</style>

      <nav className="nav">
        <Link href="/" className="logo">RESER<span>-VE</span></Link>
        <Link href="/buscar" className="nav-back">← Volver a búsqueda</Link>
      </nav>

      <div className="page">
        {/* GALERÍA */}
        <div className="gallery">
          <div className="gallery-main">
            <img src={posada.imgs[imgActiva]} alt={posada.nombre} />
          </div>
          {posada.imgs.slice(1, 3).map((img: string, i: number) => (
            <div key={i} className={`gallery-thumb ${imgActiva === i + 1 ? 'active' : ''}`} onClick={() => setImgActiva(i + 1)}>
              <img src={img} alt={`${posada.nombre} ${i + 2}`} />
            </div>
          ))}
        </div>

        <div className="layout">
          {/* COLUMNA IZQUIERDA */}
          <div className="ficha-left">
            <div className="breadcrumb">
              <Link href="/buscar" style={{color:'inherit', textDecoration:'none'}}>Posadas</Link>
              {' / '}
              <span>{posada.destino}</span>
            </div>
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
              {posada.servicios.map((s: string) => (
                <div className="servicio" key={s}>{s}</div>
              ))}
            </div>

            <hr />

            <div className="section-label">Tu anfitrión</div>
            <div className="host-card">
              <div className="host-avatar">{posada.host.nombre[0]}</div>
              <div>
                <div className="host-nombre">{posada.host.nombre}</div>
                <div className="host-meta">
                  Posadero desde {posada.host.desde}<br />
                  Idiomas: {posada.host.idiomas.join(', ')}
                </div>
              </div>
            </div>

            <div className="section-label">Políticas</div>
            <div className="politicas">
              {posada.politicas.map((p: string) => (
                <div className="politica" key={p}>{p}</div>
              ))}
            </div>

            {posada.reseñas.length > 0 && (
              <>
                <hr />
                <div className="section-label">Reseñas · ★ {posada.rating} · {posada.reviews} opiniones</div>
                <div className="reseñas">
                  {posada.reseñas.map((r: any, i: number) => (
                    <div className="reseña" key={i}>
                      <div className="reseña-header">
                        <div>
                          <div className="reseña-autor">{r.autor}</div>
                          <div className="reseña-pais">{r.pais}</div>
                        </div>
                        <div className="reseña-rating">{'★'.repeat(r.rating)}</div>
                      </div>
                      <p className="reseña-texto">"{r.texto}"</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* BOOKING CARD */}
          <div>
            <div className="booking-card">
              <div className="booking-precio">${posada.precio} <span>USD / noche</span></div>
              <div className="booking-rating">★ {posada.rating} · {posada.reviews} reseñas</div>

              <div className="booking-fields">
                <div className="booking-field">
                  <label>Llegada</label>
                  <input type="date" value={fechaEntrada} onChange={e => setFechaEntrada(e.target.value)} />
                </div>
                <div className="booking-field">
                  <label>Salida</label>
                  <input type="date" value={fechaSalida} onChange={e => setFechaSalida(e.target.value)} />
                </div>
              </div>

              <div className="booking-huespedes">
                <div className="booking-field">
                  <label>Huéspedes</label>
                  <select value={huespedes} onChange={e => setHuespedes(Number(e.target.value))} style={{background:'transparent', color:'#F5F0E8'}}>
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n} style={{background:'#1a1a18'}}>{n} {n === 1 ? 'huésped' : 'huéspedes'}</option>)}
                  </select>
                </div>
              </div>

              <button className="btn-reservar" onClick={handleReservar}>
                {noches > 0 ? `Reservar ${noches} noche${noches > 1 ? 's' : ''}` : 'Reservar ahora'}
              </button>
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
              <p className="booking-nota">No se te cobrará nada hasta confirmar la reserva. Pagos seguros vía Zelle o Zinli.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
