'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'

type DatosReserva = {
  codigo: string
  posadaNombre: string
  posadaImg: string
  posadaSlug: string
  llegada: string
  salida: string
  noches: number
  huespedes: number
  precio: number
  subtotal: number
  comision: number
  total: number
  metodoPago: string
  metodoPagoLabel: string
  nombreViajero: string
  email: string
}

function instruccionesPago(metodo: string, total: number, codigo: string): string {
  switch (metodo) {
    case 'zelle':
      return `Transfiere $${total} USD a zelle@reser-ve.com. Incluye el código ${codigo} en el concepto del pago.`
    case 'zinli':
      return `Envía $${total} USD a @reserveve en Zinli. Incluye el código ${codigo} en el mensaje.`
    case 'pagomovil':
      return `Pago Móvil al 0412-5550000 (Banco Mercantil), RIF J-40055123-4, a nombre de RESER-VE C.A. Monto equivalente a $${total} USD al tipo de cambio oficial. Concepto: ${codigo}.`
    case 'tarjeta':
      return `El pago con tarjeta no está disponible en esta beta. Por favor contáctanos por WhatsApp para completar tu reserva con el código ${codigo}.`
    default:
      return `Contacta con RESER-VE para completar el pago de $${total} USD. Código: ${codigo}.`
  }
}

function formatFecha(fecha: string): string {
  if (!fecha) return ''
  const [y, m, d] = fecha.split('-')
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${d} ${meses[parseInt(m) - 1]}. ${y}`
}

function ConfirmadaContent() {
  const [datos, setDatos] = useState<DatosReserva | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('reserva')
    if (raw) {
      try {
        setDatos(JSON.parse(raw))
      } catch {
        // ignore
      }
    }
  }, [])

  if (!datos) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A08', color: '#F5F0E8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', gap: '1rem' }}>
        <p style={{ fontSize: '1rem', color: 'rgba(245,240,232,0.5)' }}>No se encontraron datos de reserva.</p>
        <Link href="/buscar" style={{ color: '#D4A853', textDecoration: 'none', fontSize: '0.85rem' }}>Explorar posadas →</Link>
      </div>
    )
  }

  const instrucciones = instruccionesPago(datos.metodoPago, datos.total, datos.codigo)

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

        .page { max-width:680px; margin:0 auto; padding:4rem 2rem 6rem; }

        .check-icon {
          width:56px; height:56px; border-radius:50%;
          border:1px solid rgba(212,168,83,0.4); background:rgba(212,168,83,0.08);
          display:flex; align-items:center; justify-content:center;
          font-size:1.4rem; margin-bottom:1.5rem;
        }

        .page-title { font-family:'Cormorant Garamond',serif; font-size:2.6rem; font-weight:300; letter-spacing:-0.02em; margin-bottom:0.4rem; }
        .page-sub { font-size:0.85rem; color:rgba(245,240,232,0.45); margin-bottom:0.6rem; }
        .codigo-badge {
          display:inline-block; padding:0.4rem 0.9rem;
          border:0.5px solid rgba(212,168,83,0.35); background:rgba(212,168,83,0.07);
          font-size:0.8rem; letter-spacing:0.12em; color:#D4A853; margin-bottom:3rem;
        }

        .card {
          border:0.5px solid rgba(245,240,232,0.08); padding:1.75rem; margin-bottom:1.25rem;
        }
        .card-title { font-size:0.65rem; letter-spacing:0.2em; text-transform:uppercase; color:#D4A853; margin-bottom:1.25rem; display:flex; align-items:center; gap:0.6rem; }
        .card-title::before { content:''; width:1rem; height:0.5px; background:#D4A853; opacity:0.6; }

        .resumen-grid { display:grid; grid-template-columns:80px 1fr; gap:1rem; align-items:start; margin-bottom:1.5rem; }
        .resumen-img { width:80px; height:60px; object-fit:cover; filter:brightness(0.8); }
        .resumen-nombre { font-family:'Cormorant Garamond',serif; font-size:1.2rem; font-weight:400; margin-bottom:0.25rem; }
        .resumen-meta { font-size:0.75rem; color:rgba(245,240,232,0.4); }

        .fechas-row { display:flex; gap:2rem; flex-wrap:wrap; margin-bottom:1rem; }
        .fecha-item { font-size:0.8rem; }
        .fecha-label { color:rgba(245,240,232,0.35); font-size:0.65rem; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:0.2rem; }
        .fecha-val { color:#F5F0E8; }

        .linea { display:flex; justify-content:space-between; font-size:0.8rem; color:rgba(245,240,232,0.5); margin-bottom:0.5rem; }
        .linea-total { display:flex; justify-content:space-between; font-size:1rem; color:#F5F0E8; font-weight:500; border-top:0.5px solid rgba(245,240,232,0.1); padding-top:0.75rem; margin-top:0.5rem; }

        .instrucciones {
          background:rgba(212,168,83,0.05); border:0.5px solid rgba(212,168,83,0.2);
          padding:1.25rem 1.5rem; margin-top:1.25rem;
        }
        .instrucciones-title { font-size:0.65rem; letter-spacing:0.15em; text-transform:uppercase; color:#D4A853; margin-bottom:0.75rem; }
        .instrucciones-text { font-size:0.84rem; color:rgba(245,240,232,0.65); line-height:1.7; }

        .btns { display:flex; gap:1rem; flex-wrap:wrap; margin-top:2.5rem; }
        .btn-primary {
          padding:0.95rem 1.5rem; background:#D4A853; color:#0A0A08;
          font-size:0.78rem; letter-spacing:0.12em; text-transform:uppercase;
          border:none; font-family:'DM Sans',sans-serif; font-weight:500;
          text-decoration:none; display:inline-block; transition:background 0.25s;
        }
        .btn-primary:hover { background:#E8BC6A; }
        .btn-secondary {
          padding:0.95rem 1.5rem; background:transparent;
          border:0.5px solid rgba(245,240,232,0.2); color:rgba(245,240,232,0.6);
          font-size:0.78rem; letter-spacing:0.12em; text-transform:uppercase;
          font-family:'DM Sans',sans-serif; text-decoration:none; display:inline-block;
          transition:all 0.25s;
        }
        .btn-secondary:hover { border-color:rgba(245,240,232,0.5); color:#F5F0E8; }
      `}</style>

      <nav className="nav">
        <Link href="/" className="logo">RESER<span>-VE</span></Link>
      </nav>

      <div className="page">
        <div className="check-icon">✓</div>
        <div className="page-title">¡Reserva confirmada!</div>
        <div className="page-sub">Hola {datos.nombreViajero}, hemos recibido tu solicitud. Recibirás confirmación en {datos.email}.</div>
        <div className="codigo-badge">{datos.codigo}</div>

        {/* RESUMEN POSADA */}
        <div className="card">
          <div className="card-title">Tu alojamiento</div>
          <div className="resumen-grid">
            <img src={datos.posadaImg} alt={datos.posadaNombre} className="resumen-img" />
            <div>
              <div className="resumen-nombre">{datos.posadaNombre}</div>
              <div className="resumen-meta">{datos.noches} noche{datos.noches > 1 ? 's' : ''} · {datos.huespedes} huésped{datos.huespedes > 1 ? 'es' : ''}</div>
            </div>
          </div>
          <div className="fechas-row">
            <div className="fecha-item">
              <div className="fecha-label">Llegada</div>
              <div className="fecha-val">{formatFecha(datos.llegada)}</div>
            </div>
            <div className="fecha-item">
              <div className="fecha-label">Salida</div>
              <div className="fecha-val">{formatFecha(datos.salida)}</div>
            </div>
          </div>
        </div>

        {/* DETALLE PRECIO */}
        <div className="card">
          <div className="card-title">Detalle del pago</div>
          <div className="linea">
            <span>${datos.precio} × {datos.noches} noche{datos.noches > 1 ? 's' : ''}</span>
            <span>${datos.subtotal}</span>
          </div>
          <div className="linea">
            <span>Comisión RESER-VE (10%)</span>
            <span>${datos.comision}</span>
          </div>
          <div className="linea-total">
            <span>Total pagado</span>
            <span>${datos.total} USD</span>
          </div>
          <div className="instrucciones">
            <div className="instrucciones-title">Instrucciones · {datos.metodoPagoLabel}</div>
            <p className="instrucciones-text">{instrucciones}</p>
          </div>
        </div>

        <div className="btns">
          <Link href="/buscar" className="btn-primary">Explorar más posadas</Link>
          <Link href="/" className="btn-secondary">Volver al inicio</Link>
        </div>
      </div>
    </>
  )
}

export default function ConfirmadaPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0A0A08', color: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif' }}>
        Cargando...
      </div>
    }>
      <ConfirmadaContent />
    </Suspense>
  )
}
