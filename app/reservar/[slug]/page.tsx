'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { getPosada } from '@/lib/data'

function ReservarContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const posada = getPosada(slug)

  const llegadaParam = searchParams.get('llegada') || ''
  const salidaParam = searchParams.get('salida') || ''
  const huespedesParam = Number(searchParams.get('huespedes') || 2)

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [pais, setPais] = useState('')
  const [metodoPago, setMetodoPago] = useState<'zelle' | 'zinli' | 'pagomovil' | 'tarjeta'>('zelle')
  const [llegada, setLlegada] = useState(llegadaParam)
  const [salida, setSalida] = useState(salidaParam)
  const [huespedes] = useState(huespedesParam)

  if (!posada) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A08', color: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Posada no encontrada</p>
          <Link href="/buscar" style={{ color: '#D4A853', textDecoration: 'none' }}>← Volver a búsqueda</Link>
        </div>
      </div>
    )
  }

  const noches = llegada && salida
    ? Math.max(0, Math.round((new Date(salida).getTime() - new Date(llegada).getTime()) / 86400000))
    : 0
  const subtotal = noches * posada.precio
  const comision = Math.round(subtotal * 0.1)
  const total = subtotal + comision

  const metodosInfo = {
    zelle: { label: 'Zelle', desc: 'Pago en USD desde EE.UU. o internacionalmente' },
    zinli: { label: 'Zinli', desc: 'Billetera digital en USD, disponible en Venezuela' },
    pagomovil: { label: 'Pago Móvil', desc: 'Transferencia bancaria en bolívares (tipo de cambio oficial)' },
    tarjeta: { label: 'Tarjeta', desc: 'Visa / Mastercard (próximamente)' },
  }

  const handleConfirmar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre || !email || !llegada || !salida) return

    const codigo = `RV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    const datos = {
      codigo,
      posadaNombre: posada.nombre,
      posadaImg: posada.imgs[0],
      posadaSlug: slug,
      llegada,
      salida,
      noches,
      huespedes,
      precio: posada.precio,
      subtotal,
      comision,
      total,
      metodoPago,
      metodoPagoLabel: metodosInfo[metodoPago].label,
      nombreViajero: nombre,
      email,
    }
    sessionStorage.setItem('reserva', JSON.stringify(datos))
    router.push('/reserva/confirmada')
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

        .page { max-width:1000px; margin:0 auto; padding:3rem 2rem 5rem; }

        .page-title { font-family:'Cormorant Garamond',serif; font-size:2.4rem; font-weight:300; letter-spacing:-0.02em; margin-bottom:0.4rem; }
        .page-sub { font-size:0.82rem; color:rgba(245,240,232,0.4); margin-bottom:3rem; }

        .layout { display:grid; grid-template-columns:1fr 340px; gap:3rem; align-items:start; }
        @media(max-width:860px) { .layout { grid-template-columns:1fr; } }

        /* RESUMEN CARD */
        .resumen {
          position:sticky; top:6rem;
          border:0.5px solid rgba(212,168,83,0.2); padding:1.75rem;
          background:rgba(212,168,83,0.03);
        }
        .resumen-img { width:100%; aspect-ratio:16/9; object-fit:cover; filter:brightness(0.8); margin-bottom:1.25rem; }
        .resumen-nombre { font-family:'Cormorant Garamond',serif; font-size:1.35rem; font-weight:400; margin-bottom:0.3rem; }
        .resumen-destino { font-size:0.72rem; color:rgba(245,240,232,0.4); letter-spacing:0.08em; margin-bottom:1.5rem; }
        .resumen-hr { border:none; border-top:0.5px solid rgba(245,240,232,0.08); margin:1rem 0; }
        .resumen-linea { display:flex; justify-content:space-between; font-size:0.8rem; color:rgba(245,240,232,0.5); margin-bottom:0.5rem; }
        .resumen-total { display:flex; justify-content:space-between; font-size:1rem; color:#F5F0E8; font-weight:500; border-top:0.5px solid rgba(245,240,232,0.1); padding-top:0.75rem; margin-top:0.5rem; }
        .resumen-no-fechas { font-size:0.8rem; color:rgba(245,240,232,0.35); font-style:italic; text-align:center; padding:1rem 0; }

        /* FORM */
        .section-label { font-size:0.65rem; letter-spacing:0.2em; text-transform:uppercase; color:#D4A853; margin-bottom:1.25rem; display:flex; align-items:center; gap:0.6rem; }
        .section-label::before { content:''; width:1rem; height:0.5px; background:#D4A853; opacity:0.6; }

        .form-group { margin-bottom:1.25rem; }
        .form-label { display:block; font-size:0.65rem; letter-spacing:0.15em; text-transform:uppercase; color:rgba(245,240,232,0.45); margin-bottom:0.5rem; }
        .form-input {
          width:100%; padding:0.85rem 1rem;
          background:rgba(245,240,232,0.04); border:0.5px solid rgba(245,240,232,0.12);
          color:#F5F0E8; font-family:'DM Sans',sans-serif; font-size:0.88rem;
          outline:none; transition:border-color 0.25s;
        }
        .form-input:focus { border-color:rgba(212,168,83,0.5); }
        .form-input::placeholder { color:rgba(245,240,232,0.2); }
        .form-input[type="date"]::-webkit-calendar-picker-indicator { filter:invert(1) opacity(0.4); }

        .form-row { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
        @media(max-width:500px) { .form-row { grid-template-columns:1fr; } }

        /* MÉTODOS PAGO */
        .metodos { display:grid; grid-template-columns:1fr 1fr; gap:0.65rem; margin-bottom:2rem; }
        .metodo-btn {
          padding:0.85rem; border:0.5px solid rgba(245,240,232,0.12);
          background:transparent; color:rgba(245,240,232,0.5);
          font-family:'DM Sans',sans-serif; font-size:0.8rem;
          cursor:pointer; transition:all 0.25s; text-align:left;
        }
        .metodo-btn:hover { border-color:rgba(245,240,232,0.25); color:#F5F0E8; }
        .metodo-btn.active { border-color:#D4A853; color:#D4A853; background:rgba(212,168,83,0.06); }
        .metodo-name { font-weight:500; margin-bottom:0.25rem; }
        .metodo-desc { font-size:0.68rem; color:rgba(245,240,232,0.35); line-height:1.4; }
        .metodo-btn.active .metodo-desc { color:rgba(212,168,83,0.6); }

        .btn-confirmar {
          width:100%; padding:1.1rem; background:#D4A853; color:#0A0A08;
          font-size:0.82rem; letter-spacing:0.15em; text-transform:uppercase;
          border:none; cursor:pointer; font-family:'DM Sans',sans-serif; font-weight:500;
          transition:all 0.3s ease; margin-top:0.5rem;
        }
        .btn-confirmar:hover { background:#E8BC6A; }
        .btn-confirmar:disabled { opacity:0.4; cursor:not-allowed; }

        .nota { font-size:0.68rem; color:rgba(245,240,232,0.25); text-align:center; margin-top:0.75rem; line-height:1.6; }

        hr { border:none; border-top:0.5px solid rgba(245,240,232,0.07); margin:2rem 0; }
      `}</style>

      <nav className="nav">
        <Link href="/" className="logo">RESER<span>-VE</span></Link>
        <Link href={`/posadas/${slug}`} className="nav-back">← Volver a la posada</Link>
      </nav>

      <div className="page">
        <div className="page-title">Completa tu reserva</div>
        <div className="page-sub">Rellena los datos y confirma. Sin cobros hasta que el posadero acepte.</div>

        <form onSubmit={handleConfirmar}>
          <div className="layout">
            {/* FORMULARIO */}
            <div>
              <div className="section-label">Fechas y huéspedes</div>
              <div className="form-row" style={{ marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Llegada</label>
                  <input
                    type="date"
                    className="form-input"
                    value={llegada}
                    onChange={e => setLlegada(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Salida</label>
                  <input
                    type="date"
                    className="form-input"
                    value={salida}
                    onChange={e => setSalida(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Huéspedes</label>
                <input
                  type="text"
                  className="form-input"
                  value={`${huespedes} ${huespedes === 1 ? 'huésped' : 'huéspedes'}`}
                  readOnly
                  style={{ color: 'rgba(245,240,232,0.5)' }}
                />
              </div>

              <hr />

              <div className="section-label">Datos del viajero</div>
              <div className="form-group">
                <label className="form-label">Nombre completo</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Tu nombre completo"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+1 000 000 0000"
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">País de residencia</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Venezuela, España, EE.UU…"
                  value={pais}
                  onChange={e => setPais(e.target.value)}
                />
              </div>

              <hr />

              <div className="section-label">Método de pago</div>
              <div className="metodos">
                {(Object.entries(metodosInfo) as [typeof metodoPago, { label: string; desc: string }][]).map(([key, info]) => (
                  <button
                    type="button"
                    key={key}
                    className={`metodo-btn ${metodoPago === key ? 'active' : ''}`}
                    onClick={() => setMetodoPago(key)}
                  >
                    <div className="metodo-name">{info.label}</div>
                    <div className="metodo-desc">{info.desc}</div>
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="btn-confirmar"
                disabled={!nombre || !email || !llegada || !salida}
              >
                Confirmar reserva
              </button>
              <p className="nota">Recibirás los detalles de pago al confirmar. El posadero tiene 24h para aceptar.</p>
            </div>

            {/* RESUMEN */}
            <div>
              <div className="resumen">
                <img src={posada.imgs[0]} alt={posada.nombre} className="resumen-img" />
                <div className="resumen-nombre">{posada.nombre}</div>
                <div className="resumen-destino">{posada.destino} · {posada.tipo}</div>

                {noches > 0 ? (
                  <>
                    <div className="resumen-linea">
                      <span>${posada.precio} × {noches} noche{noches > 1 ? 's' : ''}</span>
                      <span>${subtotal}</span>
                    </div>
                    <div className="resumen-linea">
                      <span>Comisión RESER-VE (10%)</span>
                      <span>${comision}</span>
                    </div>
                    <div className="resumen-total">
                      <span>Total</span>
                      <span>${total} USD</span>
                    </div>
                  </>
                ) : (
                  <div className="resumen-no-fechas">Selecciona fechas para ver el precio total</div>
                )}

                <div className="resumen-hr" />
                <div style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.3)', lineHeight: '1.7' }}>
                  ★ {posada.rating} · {posada.reviews} reseñas<br />
                  {posada.habitaciones} habitaciones · {posada.servicios[0]}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}

export default function ReservarPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0A0A08', color: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif' }}>
        Cargando...
      </div>
    }>
      <ReservarContent slug={params.slug} />
    </Suspense>
  )
}
