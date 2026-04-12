'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function instrucciones(metodo: string, total: number, codigo: string) {
  const m: Record<string, string> = {
    zelle: `Transfiere $${total} USD a zelle@reser-ve.com. Escribe el código ${codigo} en el concepto del pago.`,
    zinli: `Envía $${total} USD a @reserveve en Zinli. Incluye el código ${codigo} en el mensaje.`,
    pagomovil: `Pago Móvil al 0412-5550000 (Banco Mercantil), RIF J-40055123-4, RESER-VE C.A. Monto equivalente a $${total} USD al tipo oficial. Concepto: ${codigo}.`,
    tarjeta: `El pago con tarjeta estará disponible próximamente. Contáctanos por WhatsApp con el código ${codigo} para procesar tu reserva.`,
  }
  return m[metodo] || `Contacta con RESER-VE con el código ${codigo} para completar el pago de $${total} USD.`
}

function fmt(fecha: string) {
  if (!fecha) return ''
  const [y, m, d] = fecha.split('-')
  return `${d} ${['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][+m-1]} ${y}`
}

function ConfirmadaContent() {
  const sp = useSearchParams()

  const code     = sp.get('code') ?? ''
  const posada   = sp.get('posada') ?? ''
  const img      = sp.get('img') ?? ''
  const slug     = sp.get('slug') ?? ''
  const llegada  = sp.get('llegada') ?? ''
  const salida   = sp.get('salida') ?? ''
  const noches   = Number(sp.get('noches') ?? 0)
  const huespedes = Number(sp.get('huespedes') ?? 1)
  const precio   = Number(sp.get('precio') ?? 0)
  const subtotal = Number(sp.get('subtotal') ?? 0)
  const comision = Number(sp.get('comision') ?? 0)
  const total    = Number(sp.get('total') ?? 0)
  const metodo   = sp.get('metodo') ?? ''
  const metodoLabel = sp.get('metodoLabel') ?? ''

  if (!code) {
    return (
      <div style={{minHeight:'100vh',background:'#FDFBF7',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'Inter,sans-serif',color:'#1A2B4C',gap:'1rem'}}>
        <p style={{fontSize:'1rem',color:'#7A8699'}}>No se encontraron datos de reserva.</p>
        <Link href="/buscar" style={{color:'#E67E22',textDecoration:'none',fontWeight:600}}>Explorar posadas →</Link>
      </div>
    )
  }

  return (
    <>
      <style>{`
        :root{--indigo:#1A2B4C;--cacao:#E67E22;--cacao-dark:#C96510;--sand:#FDFBF7;--text:#1A2B4C;--muted:#7A8699;--line:rgba(26,43,76,0.08);--shadow:0 8px 30px rgba(26,43,76,0.08);}
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Inter',sans-serif;background:radial-gradient(circle at top left,rgba(230,126,34,0.06) 0%,transparent 30%),linear-gradient(180deg,#fffefb 0%,var(--sand) 100%);color:var(--text);min-height:100vh;}
        .grain{position:fixed;inset:0;pointer-events:none;z-index:100;opacity:0.018;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");}
        .nav{position:sticky;top:0;z-index:60;display:flex;align-items:center;justify-content:space-between;padding:1rem 2rem;background:rgba(253,251,247,0.92);backdrop-filter:blur(18px);border-bottom:1px solid var(--line);box-shadow:0 4px 20px rgba(26,43,76,0.05);}
        .logo{font-size:1.6rem;font-weight:800;letter-spacing:-0.04em;color:var(--indigo);text-decoration:none;}
        .logo span{color:var(--cacao);}
        .steps{display:flex;align-items:center;gap:0.5rem;font-size:0.78rem;}
        .step{padding:0.3rem 0.75rem;border-radius:999px;font-weight:600;background:rgba(230,126,34,0.1);color:var(--cacao);}
        .page{max-width:720px;margin:0 auto;padding:3.5rem 1.5rem 6rem;}
        .hero{text-align:center;margin-bottom:2.5rem;}
        @keyframes popIn{0%{transform:scale(0.6);opacity:0}70%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
        @keyframes drawCircle{0%{stroke-dashoffset:213}100%{stroke-dashoffset:0}}
        .success-ring{width:80px;height:80px;margin:0 auto 1.5rem;animation:popIn 0.5s cubic-bezier(0.16,1,0.3,1) both;}
        .success-ring svg{width:80px;height:80px;}
        .ring-fg{stroke:var(--cacao);stroke-dasharray:213;stroke-dashoffset:213;animation:drawCircle 1s ease 0.3s forwards;}
        .page-title{font-size:clamp(2rem,5vw,2.8rem);font-weight:800;color:var(--indigo);margin-bottom:0.5rem;line-height:1.2;letter-spacing:-0.03em;}
        .page-sub{font-size:0.92rem;color:var(--muted);margin-bottom:1.75rem;line-height:1.7;}
        .status-banner{background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:12px;padding:0.85rem 1.1rem;font-size:0.84rem;color:#92400e;margin-bottom:2rem;display:flex;align-items:center;gap:0.6rem;line-height:1.5;}
        .codigo-box{background:linear-gradient(135deg,rgba(230,126,34,0.08),rgba(230,126,34,0.04));border:2px dashed rgba(230,126,34,0.3);border-radius:20px;padding:1.5rem;display:inline-block;min-width:280px;margin-bottom:2.5rem;}
        .codigo-label{font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:var(--muted);margin-bottom:0.5rem;}
        .codigo-value{font-size:1.8rem;font-weight:800;letter-spacing:0.12em;color:var(--cacao);line-height:1;font-variant-numeric:tabular-nums;}
        .codigo-hint{font-size:0.75rem;color:var(--muted);margin-top:0.6rem;line-height:1.5;}
        .card{background:white;border:1px solid var(--line);border-radius:24px;overflow:hidden;box-shadow:var(--shadow);margin-bottom:1.25rem;}
        .card-header{padding:1.1rem 1.5rem;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:0.75rem;}
        .card-header-icon{width:32px;height:32px;border-radius:50%;background:rgba(230,126,34,0.1);display:flex;align-items:center;justify-content:center;font-size:0.9rem;flex-shrink:0;color:var(--cacao);font-weight:700;}
        .card-header-title{font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted);}
        .card-body{padding:1.5rem;}
        .posada-grid{display:grid;grid-template-columns:88px 1fr;gap:1rem;align-items:center;margin-bottom:1.25rem;}
        .posada-img{width:88px;height:66px;object-fit:cover;border-radius:12px;}
        .posada-nombre{font-size:1.05rem;font-weight:800;letter-spacing:-0.03em;color:var(--indigo);margin-bottom:0.2rem;}
        .posada-meta{font-size:0.8rem;color:var(--muted);}
        .fechas{display:flex;gap:2.5rem;flex-wrap:wrap;}
        .fecha-label{font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--cacao);margin-bottom:0.2rem;}
        .fecha-val{font-size:0.95rem;font-weight:700;color:var(--indigo);}
        .linea{display:flex;justify-content:space-between;font-size:0.85rem;color:var(--muted);margin-bottom:0.4rem;}
        .linea-total{display:flex;justify-content:space-between;font-size:1rem;font-weight:800;color:var(--indigo);border-top:1px solid var(--line);padding-top:0.75rem;margin-top:0.5rem;}
        .instrucciones-box{background:rgba(26,43,76,0.04);border-left:4px solid var(--cacao);border-radius:0 12px 12px 0;padding:1.1rem 1.25rem;margin-top:1.25rem;}
        .instrucciones-label{font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--cacao);margin-bottom:0.5rem;}
        .instrucciones-text{font-size:0.88rem;color:var(--text);line-height:1.7;}
        .btns{display:flex;gap:0.75rem;flex-wrap:wrap;margin-top:2rem;justify-content:center;}
        .btn-primary{padding:0.95rem 2rem;background:var(--cacao);color:white;font-size:0.88rem;font-weight:700;border-radius:999px;text-decoration:none;display:inline-block;box-shadow:0 10px 25px rgba(230,126,34,0.25);transition:all 0.22s;}
        .btn-primary:hover{background:var(--cacao-dark);transform:translateY(-1px);}
        .btn-secondary{padding:0.95rem 2rem;background:white;border:1.5px solid rgba(26,43,76,0.15);color:var(--indigo);font-size:0.88rem;font-weight:600;border-radius:999px;text-decoration:none;display:inline-block;transition:all 0.22s;}
        .btn-secondary:hover{border-color:rgba(26,43,76,0.3);box-shadow:var(--shadow);transform:translateY(-1px);}
      `}</style>
      <div className="grain" />
      <nav className="nav">
        <Link href="/" className="logo">RESER<span>-VE</span></Link>
        <div className="steps">
          <span className="step">✓ Posada</span>
          <span style={{color:'var(--muted)',fontSize:'0.7rem'}}>—</span>
          <span className="step">✓ Reserva</span>
          <span style={{color:'var(--muted)',fontSize:'0.7rem'}}>—</span>
          <span className="step">✓ Confirmada</span>
        </div>
      </nav>

      <div className="page">
        <div className="hero">
          <div className="success-ring">
            <svg viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(230,126,34,0.15)" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" fill="none" strokeWidth="6" strokeLinecap="round" className="ring-fg" />
              <text x="40" y="47" textAnchor="middle" fontSize="22" fill="#E67E22" fontWeight="700">✓</text>
            </svg>
          </div>
          <div className="page-title">¡Solicitud enviada!</div>
          <div className="page-sub">Tu reserva está pendiente de confirmación por el posadero.<br />Recibirás instrucciones de pago cuando sea aceptada.</div>

          <div className="status-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>El posadero tiene <strong>24 horas</strong> para confirmar o rechazar tu solicitud. Sin cargos hasta la confirmación.</span>
          </div>

          <div style={{display:'flex',justifyContent:'center'}}>
            <div className="codigo-box">
              <div className="codigo-label">Código de reserva</div>
              <div className="codigo-value">{code}</div>
              <div className="codigo-hint">Guarda este código — lo necesitarás para cualquier consulta</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-header-icon">⌂</div>
            <div className="card-header-title">Tu alojamiento</div>
          </div>
          <div className="card-body">
            <div className="posada-grid">
              {img && <img src={img} alt={posada} className="posada-img" />}
              <div>
                <div className="posada-nombre">{posada}</div>
                <div className="posada-meta">{noches} noche{noches>1?'s':''} · {huespedes} huésped{huespedes>1?'es':''}</div>
              </div>
            </div>
            <div className="fechas">
              <div><div className="fecha-label">Llegada</div><div className="fecha-val">{fmt(llegada)}</div></div>
              <div><div className="fecha-label">Salida</div><div className="fecha-val">{fmt(salida)}</div></div>
            </div>
          </div>
        </div>

        {total > 0 && (
          <div className="card">
            <div className="card-header">
              <div className="card-header-icon">$</div>
              <div className="card-header-title">Detalle del pago</div>
            </div>
            <div className="card-body">
              <div className="linea"><span>${precio} × {noches} noche{noches>1?'s':''}</span><span>${subtotal}</span></div>
              <div className="linea"><span>Comisión RESER-VE (10%)</span><span>${comision}</span></div>
              <div className="linea-total"><span>Total</span><span>${total} USD</span></div>
              <div className="instrucciones-box">
                <div className="instrucciones-label">Instrucciones · {metodoLabel}</div>
                <p className="instrucciones-text">{instrucciones(metodo, total, code)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="btns">
          <Link href="/mis-reservas" className="btn-primary">Ver mis reservas</Link>
          {slug && <Link href={`/posadas/${slug}`} className="btn-secondary">Ver la posada</Link>}
        </div>
      </div>
    </>
  )
}

export default function ConfirmadaPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',background:'#FDFBF7',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Inter,sans-serif',color:'#1A2B4C'}}>Cargando…</div>}>
      <ConfirmadaContent />
    </Suspense>
  )
}
