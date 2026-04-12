'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { type Posada } from '@/lib/data'

const MONTHS_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
function fmt(fecha: string) {
  if (!fecha) return ''
  const [y, m, d] = fecha.split('-')
  return `${d} ${MONTHS_SHORT[+m-1]} ${y}`
}

function ReservarContent() {
  const rawParams = useParams<{ slug: string }>()
  const slug = rawParams?.slug ?? ''
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()

  const [posada, setPosada] = useState<Posada & { id: number } | null>(null)
  const [loadingPosada, setLoadingPosada] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [llegada, setLlegada] = useState(searchParams.get('llegada') || '')
  const [salida, setSalida] = useState(searchParams.get('salida') || '')
  const [huespedes] = useState(Number(searchParams.get('huespedes') || 2))
  const [metodoPago, setMetodoPago] = useState<'zelle'|'zinli'|'pagomovil'|'tarjeta'>('zelle')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Fetch posada from API
  useEffect(() => {
    fetch(`/api/posadas/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || data.error) { setNotFound(true); return }
        // Map DB row to Posada shape
        setPosada({
          ...data,
          host: { nombre: data.hostNombre ?? '', desde: data.hostDesde ?? '', idiomas: data.hostIdiomas ?? [] },
          reseñas: [],
          tags: data.tags ?? [],
          servicios: data.servicios ?? [],
          politicas: data.politicas ?? [],
          imgs: data.imgs ?? [],
          metodoPago: data.metodoPago ?? [],
        })
      })
      .finally(() => setLoadingPosada(false))
  }, [slug])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push(`/login?callbackUrl=/reservar/${slug}${window.location.search}`)
    }
  }, [authStatus, slug, router])

  const noches = llegada && salida
    ? Math.max(0, Math.round((new Date(salida).getTime() - new Date(llegada).getTime()) / 86400000))
    : 0
  const subtotal = noches * (posada?.precio ?? 0)
  const comision = Math.round(subtotal * 0.1)
  const total = subtotal + comision

  const metodos: Record<typeof metodoPago, { label: string; desc: string; icon: string }> = {
    zelle:     { label: 'Zelle',      desc: 'USD desde EE.UU. o internacionalmente', icon: '$' },
    zinli:     { label: 'Zinli',      desc: 'Billetera digital en USD',              icon: 'Ƶ' },
    pagomovil: { label: 'Pago Móvil', desc: 'Transferencia en bolívares',            icon: 'PM' },
    tarjeta:   { label: 'Tarjeta',    desc: 'Visa / Mastercard',                     icon: 'CC' },
  }

  const handleConfirmar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!posada || noches < 1) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posadaId: posada.id,
          checkIn: llegada,
          checkOut: salida,
          nights: noches,
          totalPrice: total,
          paymentMethod: metodos[metodoPago].label,
          guestCount: huespedes,
          notes: notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al crear la reserva'); return }
      const params = new URLSearchParams({
        code: data.bookingCode,
        posada: posada.nombre,
        img: posada.imgs[0] ?? '',
        slug,
        llegada, salida,
        noches: String(noches),
        huespedes: String(huespedes),
        precio: String(posada.precio),
        subtotal: String(subtotal),
        comision: String(comision),
        total: String(total),
        metodo: metodoPago,
        metodoLabel: metodos[metodoPago].label,
      })
      router.push(`/reserva/confirmada?${params.toString()}`)
    } catch {
      setError('Error de red. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const isLoading = loadingPosada || authStatus === 'loading'

  if (isLoading) {
    return <div style={{minHeight:'100vh',background:'#FDFBF7',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Inter,sans-serif',color:'#1A2B4C'}}>Cargando…</div>
  }

  if (notFound || !posada) {
    return (
      <div style={{minHeight:'100vh',background:'#FDFBF7',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'Inter,sans-serif',color:'#1A2B4C',gap:'1rem'}}>
        <p style={{fontSize:'1.1rem',fontWeight:700}}>Posada no encontrada</p>
        <Link href="/buscar" style={{color:'#E67E22',textDecoration:'none'}}>← Volver a búsqueda</Link>
      </div>
    )
  }

  if (authStatus === 'unauthenticated') {
    return <div style={{minHeight:'100vh',background:'#FDFBF7',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Inter,sans-serif',color:'#1A2B4C'}}>Redirigiendo…</div>
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,700&family=Inter:wght@300;400;500;600;700;800&display=swap');
        :root{--indigo:#1A2B4C;--cacao:#E67E22;--cacao-dark:#C96510;--sand:#FDFBF7;--cream:#F5EFE0;--text:#1A2B4C;--muted:#7A8699;--line:rgba(26,43,76,0.08);}
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Inter',sans-serif;background:radial-gradient(circle at top left,rgba(230,126,34,0.05) 0%,transparent 30%),linear-gradient(180deg,#fffefb 0%,var(--sand) 100%);color:var(--text);min-height:100vh;}
        .grain{position:fixed;inset:0;pointer-events:none;z-index:100;opacity:0.018;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");}
        .nav{position:sticky;top:0;z-index:60;display:flex;align-items:center;justify-content:space-between;padding:1rem 2rem;background:rgba(253,251,247,0.92);backdrop-filter:blur(18px);border-bottom:1px solid var(--line);box-shadow:0 4px 20px rgba(26,43,76,0.05);}
        .logo{font-size:1.6rem;font-weight:800;letter-spacing:-0.04em;color:var(--indigo);text-decoration:none;}
        .logo span{color:var(--cacao);}
        .nav-back{font-size:0.85rem;color:var(--muted);text-decoration:none;font-weight:500;transition:color 0.2s;}
        .nav-back:hover{color:var(--indigo);}
        .steps{display:flex;align-items:center;gap:0;font-size:0.78rem;color:var(--muted);}
        .step-item{display:flex;align-items:center;}
        .step{padding:0.3rem 0.85rem;border-radius:999px;font-weight:600;position:relative;transition:all 0.22s;}
        .step.done{background:rgba(230,126,34,0.12);color:var(--cacao);}
        .step.active{background:var(--cacao);color:white;box-shadow:0 4px 12px rgba(230,126,34,0.3);}
        .step.pending{background:rgba(26,43,76,0.06);color:var(--muted);}
        .step-line{width:2rem;height:2px;background:var(--line);margin:0 0.1rem;flex-shrink:0;}
        .step-line.done{background:rgba(230,126,34,0.35);}
        .page{max-width:980px;margin:0 auto;padding:2.5rem 1.5rem 6rem;}
        .page-title{font-family:'Playfair Display',Georgia,serif;font-size:clamp(1.6rem,3.5vw,2.2rem);font-weight:700;letter-spacing:-0.02em;color:var(--indigo);margin-bottom:0.3rem;}
        .page-sub{font-size:0.88rem;color:var(--muted);margin-bottom:2.5rem;}
        .layout{display:grid;grid-template-columns:1fr 320px;gap:2.5rem;align-items:start;}
        @media(max-width:860px){.layout{grid-template-columns:1fr;}}
        .form-section{margin-bottom:2rem;}
        .section-label{font-size:0.7rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--cacao);font-weight:700;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem;}
        .section-label::before{content:'';width:0.9rem;height:2px;background:var(--cacao);border-radius:2px;}
        .form-group{margin-bottom:1.1rem;}
        .form-label{display:block;font-size:0.75rem;font-weight:600;color:var(--indigo);margin-bottom:0.4rem;}
        .form-label .req{color:var(--cacao);margin-left:2px;}
        .form-input{width:100%;padding:0.85rem 1rem;border:1.5px solid var(--line);border-radius:12px;font-family:'Inter',sans-serif;font-size:0.9rem;color:var(--text);background:white;outline:none;transition:border-color 0.22s,box-shadow 0.22s;}
        .form-input:focus{border-color:var(--cacao);box-shadow:0 0 0 3px rgba(230,126,34,0.12);}
        .form-input::placeholder{color:rgba(26,43,76,0.25);}
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem;}
        @media(max-width:500px){.form-row{grid-template-columns:1fr;}}
        .metodos{display:grid;grid-template-columns:1fr 1fr;gap:0.65rem;margin-bottom:1.5rem;}
        .metodo-btn{padding:0.9rem 1rem;border:1.5px solid var(--line);border-radius:14px;background:white;cursor:pointer;transition:all 0.22s;text-align:left;font-family:'Inter',sans-serif;position:relative;overflow:hidden;}
        .metodo-btn:hover{border-color:rgba(230,126,34,0.3);background:rgba(230,126,34,0.02);}
        .metodo-btn.active{border-left:3px solid var(--cacao);background:rgba(230,126,34,0.05);border-color:var(--cacao);}
        .metodo-icon{position:absolute;top:0.7rem;right:0.85rem;font-size:0.9rem;font-weight:800;color:rgba(26,43,76,0.18);font-family:'Inter',sans-serif;letter-spacing:-0.02em;}
        .metodo-btn.active .metodo-icon{color:rgba(230,126,34,0.35);}
        .metodo-name{font-size:0.88rem;font-weight:700;color:var(--indigo);margin-bottom:0.2rem;padding-right:2rem;}
        .metodo-btn.active .metodo-name{color:var(--cacao);}
        .metodo-desc{font-size:0.72rem;color:var(--muted);line-height:1.4;}
        hr{border:none;border-top:1px solid var(--line);margin:1.75rem 0;}
        .btn-confirmar{width:100%;padding:1.15rem;background:linear-gradient(135deg,var(--cacao),var(--cacao-dark));color:white;font-size:0.95rem;font-weight:700;border:none;border-radius:999px;cursor:pointer;font-family:'Inter',sans-serif;box-shadow:0 12px 30px rgba(230,126,34,0.35),0 4px 12px rgba(230,126,34,0.2);transition:all 0.22s;letter-spacing:0.01em;}
        .btn-confirmar:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 16px 40px rgba(230,126,34,0.40),0 6px 16px rgba(230,126,34,0.25);}
        .btn-confirmar:disabled{opacity:0.4;cursor:not-allowed;transform:none;box-shadow:none;}
        .nota{font-size:0.74rem;color:var(--muted);text-align:center;margin-top:0.75rem;line-height:1.6;}
        .error-banner{background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:10px;padding:0.75rem 1rem;font-size:0.84rem;color:#dc2626;margin-bottom:1.25rem;}
        .guest-info{display:flex;align-items:center;gap:0.5rem;font-size:0.83rem;color:var(--muted);padding:0.65rem 1rem;background:rgba(26,43,76,0.03);border-radius:10px;margin-bottom:1.25rem;}
        .guest-avatar{width:28px;height:28px;border-radius:50%;background:var(--cacao);color:white;display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:700;flex-shrink:0;}
        .resumen{position:sticky;top:5.5rem;background:white;border:1px solid var(--line);border-radius:24px;overflow:hidden;box-shadow:0 8px 32px rgba(26,43,76,0.10);}
        .resumen-img-wrap{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;}
        .resumen-img{width:100%;height:100%;object-fit:cover;display:block;}
        .resumen-img-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 30%,var(--indigo) 100%);pointer-events:none;}
        .resumen-body{padding:1.25rem;}
        .resumen-nombre{font-size:1rem;font-weight:800;letter-spacing:-0.03em;color:var(--indigo);margin-bottom:0.2rem;}
        .resumen-dest{font-size:0.78rem;color:var(--muted);margin-bottom:1rem;}
        .resumen-hr{height:1px;background:var(--line);margin:0.9rem 0;}
        .resumen-linea{display:flex;justify-content:space-between;font-size:0.82rem;color:var(--muted);margin-bottom:0.4rem;}
        .resumen-total{display:flex;justify-content:space-between;font-size:1rem;font-weight:800;color:var(--indigo);border-top:1px solid var(--line);padding-top:0.75rem;margin-top:0.5rem;}
        .resumen-no-fechas{font-size:0.82rem;color:var(--muted);text-align:center;padding:0.75rem 0;font-style:italic;}
        .resumen-rating{font-size:0.78rem;color:var(--muted);}
        .resumen-rating strong{color:var(--cacao);}
        .trust-row{display:flex;align-items:center;gap:0.4rem;font-size:0.72rem;color:var(--muted);margin-top:0.75rem;}
        .trust-row svg{flex-shrink:0;opacity:0.5;}
      `}</style>
      <div className="grain" />
      <nav className="nav">
        <Link href="/" className="logo">RESER<span>-VE</span></Link>
        <div style={{display:'flex',alignItems:'center',gap:'1.5rem'}}>
          <div className="steps">
            <div className="step-item"><span className="step done">✓ Posada</span></div>
            <div className="step-line done" />
            <div className="step-item"><span className="step active">Reserva</span></div>
            <div className="step-line" />
            <div className="step-item"><span className="step pending">Confirmación</span></div>
          </div>
          <Link href={`/posadas/${slug}`} className="nav-back">← Volver</Link>
        </div>
      </nav>

      <div className="page">
        <div className="page-title">Completa tu reserva</div>
        <div className="page-sub">Revisa los detalles y confirma. El posadero aceptará en 24h.</div>

        <form onSubmit={handleConfirmar}>
          <div className="layout">
            <div>
              {error && <div className="error-banner">{error}</div>}

              {session?.user && (
                <div className="guest-info">
                  <div className="guest-avatar">{session.user.name?.charAt(0).toUpperCase()}</div>
                  <span>Reservando como <strong>{session.user.name}</strong> · {session.user.email}</span>
                </div>
              )}

              <div className="form-section">
                <div className="section-label">Fechas de estancia</div>
                <div className="form-row">
                  <div className="form-group" style={{marginBottom:0}}>
                    <label className="form-label">Llegada <span className="req">*</span></label>
                    <input type="date" className="form-input" value={llegada} onChange={e => setLlegada(e.target.value)} required min={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="form-group" style={{marginBottom:0}}>
                    <label className="form-label">Salida <span className="req">*</span></label>
                    <input type="date" className="form-input" value={salida} onChange={e => setSalida(e.target.value)} required min={llegada || new Date().toISOString().split('T')[0]} />
                  </div>
                </div>
              </div>

              <hr />

              <div className="form-section">
                <div className="section-label">Notas para el posadero (opcional)</div>
                <div className="form-group">
                  <textarea
                    className="form-input"
                    placeholder="Hora de llegada estimada, peticiones especiales, alergias…"
                    rows={3}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    style={{resize:'vertical'}}
                  />
                </div>
              </div>

              <hr />

              <div className="form-section">
                <div className="section-label">Método de pago preferido</div>
                <div className="metodos">
                  {(Object.entries(metodos) as [typeof metodoPago, {label:string;desc:string;icon:string}][]).map(([key, info]) => (
                    <button type="button" key={key} className={`metodo-btn${metodoPago===key?' active':''}`} onClick={() => setMetodoPago(key)}>
                      <span className="metodo-icon">{info.icon}</span>
                      <div className="metodo-name">{info.label}</div>
                      <div className="metodo-desc">{info.desc}</div>
                    </button>
                  ))}
                </div>
                <button type="submit" className="btn-confirmar" disabled={!llegada || !salida || noches < 1 || submitting}>
                  {submitting ? 'Enviando solicitud…' : 'Confirmar reserva'}
                </button>
                <p className="nota">
                  Recibirás las instrucciones de pago cuando el posadero confirme.<br />Sin cargos automáticos.
                </p>
                <div className="trust-row">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Tu reserva queda registrada y protegida en RESER-VE
                </div>
              </div>
            </div>

            <div>
              <div className="resumen">
                <div className="resumen-img-wrap">
                  {posada.imgs[0] && <img src={posada.imgs[0]} alt={posada.nombre} className="resumen-img" />}
                  <div className="resumen-img-overlay" />
                </div>
                <div className="resumen-body">
                  <div className="resumen-nombre">{posada.nombre}</div>
                  <div className="resumen-dest">{posada.destino} · {posada.tipo}</div>
                  <div className="resumen-rating"><strong>★ {posada.rating}</strong> · {posada.reviews} reseñas · {posada.habitaciones} hab.</div>
                  {noches > 0 ? (
                    <>
                      <div className="resumen-hr" />
                      <div className="resumen-linea"><span>{fmt(llegada)} → {fmt(salida)}</span><span>{noches} noche{noches>1?'s':''}</span></div>
                      <div className="resumen-linea"><span>${posada.precio} × {noches} noche{noches>1?'s':''}</span><span>${subtotal}</span></div>
                      <div className="resumen-linea"><span>Comisión RESER-VE (10%)</span><span>${comision}</span></div>
                      <div className="resumen-total"><span>Total</span><span>${total} USD</span></div>
                    </>
                  ) : (
                    <>
                      <div className="resumen-hr" />
                      <div className="resumen-no-fechas">Selecciona fechas para ver el total</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}

export default function ReservarPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',background:'#FDFBF7',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Inter,sans-serif',color:'#1A2B4C'}}>Cargando…</div>}>
      <ReservarContent />
    </Suspense>
  )
}
