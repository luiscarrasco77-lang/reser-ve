'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { posadas, type Posada } from '@/lib/data'
import { venezuelaLocations } from '@/lib/locations-ve'
import { searchPosadas, resolveLocation, type SearchOptions } from '@/lib/search'

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', background: '#e8edf0', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#7A8699', fontFamily: 'inherit', fontSize: '0.9rem' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7A8699" strokeWidth="1.5" style={{ marginBottom: '0.5rem', display: 'block', margin: '0 auto 0.5rem' }}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
        Cargando mapa…
      </div>
    </div>
  ),
})

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAYS   = ['Do','Lu','Ma','Mi','Ju','Vi','Sá']

function fmtDate(d: Date | null) {
  if (!d) return ''
  return d.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate()
}
function addMonths(d: Date, n: number) { const r=new Date(d); r.setMonth(r.getMonth()+n); return r }

function Calendar({
  checkIn, checkOut, onCheckIn, onCheckOut, compact=false,
}: {
  checkIn: Date|null; checkOut: Date|null
  onCheckIn:(d:Date|null)=>void; onCheckOut:(d:Date|null)=>void
  compact?: boolean
}) {
  const today = new Date(); today.setHours(0,0,0,0)
  const [view, setView] = useState(()=>new Date(today.getFullYear(),today.getMonth(),1))
  const [hover, setHover] = useState<Date|null>(null)
  const [step, setStep] = useState<'in'|'out'>(checkIn?'out':'in')
  const next = addMonths(view,1)

  function handleDay(date: Date) {
    if (date < today) return
    if (step==='in' || !checkIn || date <= checkIn) {
      onCheckIn(date); onCheckOut(null); setStep('out')
    } else {
      onCheckOut(date); setStep('in')
    }
  }

  function renderMonth(year: number, month: number) {
    const first = new Date(year,month,1)
    const last  = new Date(year,month+1,0)
    const cells: (Date|null)[] = []
    for (let i=0;i<first.getDay();i++) cells.push(null)
    for (let d=1;d<=last.getDate();d++) cells.push(new Date(year,month,d))
    const end = checkOut || hover
    return (
      <div className="cal-col" key={`${year}-${month}`}>
        <div className="cal-mname">{MONTHS[month]} {year}</div>
        <div className="cal-grid">
          {DAYS.map(d=><div key={d} className="cal-dname">{d}</div>)}
          {cells.map((date,i)=>{
            if (!date) return <div key={`e${i}`}/>
            const past = date < today
            const isS  = checkIn && isSameDay(date,checkIn)
            const isE  = checkOut && isSameDay(date,checkOut)
            const inR  = checkIn && end && date>checkIn && date<end
            const hovE = hover && !checkOut && isSameDay(date,hover)
            let cls='cal-day'
            if (past)          cls+=' dis'
            if (isS)           cls+=' st'
            if (isE)           cls+=' en'
            if (inR)           cls+=' rng'
            if (isS&&checkOut) cls+=' rl'
            if (isE&&!isS)     cls+=' rr'
            if (hovE&&!isE)    cls+=' hov'
            return (
              <button key={date.toISOString()} className={cls} disabled={!!past}
                onClick={()=>handleDay(date)}
                onMouseEnter={()=>{if(checkIn&&!checkOut)setHover(date)}}
                onMouseLeave={()=>setHover(null)}>
                {date.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const nights = checkIn&&checkOut ? Math.round((checkOut.getTime()-checkIn.getTime())/86400000) : 0

  return (
    <div className={`cal-wrap${compact?' compact':''}`}>
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={()=>setView(v=>addMonths(v,-1))}>‹</button>
        <div style={{flex:1}}/>
        <button className="cal-nav-btn" onClick={()=>setView(v=>addMonths(v,1))}>›</button>
      </div>
      <div className={compact ? 'cal-single' : 'cal-double'}>
        {renderMonth(view.getFullYear(), view.getMonth())}
        {!compact && renderMonth(next.getFullYear(), next.getMonth())}
      </div>
      <div className="cal-footer">
        <span className="cal-summary">
          {nights>0
            ? `${nights} noche${nights>1?'s':''}: ${fmtDate(checkIn)} – ${fmtDate(checkOut)}`
            : step==='in' ? 'Selecciona la entrada' : 'Ahora elige la salida'}
        </span>
        <button className="cal-clear" onClick={()=>{onCheckIn(null);onCheckOut(null);setStep('in')}}>
          Borrar fechas
        </button>
      </div>
    </div>
  )
}

function PosadaDrawer({ posada, onClose }: { posada: Posada; onClose: ()=>void }) {
  const router = useRouter()
  const [imgIdx,   setImgIdx]   = useState(0)
  const [checkIn,  setCheckIn]  = useState<Date|null>(null)
  const [checkOut, setCheckOut] = useState<Date|null>(null)
  const [pago,     setPago]     = useState('')
  const [showDates, setShowDates] = useState(false)
  const [showPago,  setShowPago]  = useState(false)

  const nights = checkIn&&checkOut ? Math.round((checkOut.getTime()-checkIn.getTime())/86400000) : 0
  const total  = nights * posada.precio

  const PAGO_OPTS = ['Zelle','Transferencia bancaria','Efectivo USD','Efectivo Bs','Tarjeta de crédito']

  function handleReserve() {
    const params = new URLSearchParams()
    if (checkIn)  params.set('checkIn',  checkIn.toISOString().split('T')[0])
    if (checkOut) params.set('checkOut', checkOut.toISOString().split('T')[0])
    if (pago)     params.set('pago', pago)
    router.push(`/posadas/${posada.slug}?${params.toString()}`)
  }

  return (
    <>
      <button className="drw-close" onClick={onClose} aria-label="Cerrar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      <div className="drw-gal">
        <img src={posada.imgs[imgIdx]} alt={posada.nombre} className="drw-img" key={imgIdx}/>
        <div className="drw-dots">
          {posada.imgs.map((_,i)=>(
            <button key={i} className={`drw-dot${i===imgIdx?' on':''}`} onClick={()=>setImgIdx(i)} aria-label={`Foto ${i+1}`}/>
          ))}
        </div>
        {imgIdx>0 && <button className="drw-arrow left" onClick={()=>setImgIdx(i=>i-1)}>‹</button>}
        {imgIdx<posada.imgs.length-1 && <button className="drw-arrow right" onClick={()=>setImgIdx(i=>i+1)}>›</button>}
        <div className="drw-tipo-badge">{posada.tipo}</div>
      </div>

      <div className="drw-body">
        <div className="drw-header">
          <div style={{flex:1,minWidth:0}}>
            <h2 className="drw-name">{posada.nombre}</h2>
            <div className="drw-meta">
              <span className="drw-stars">{'★'.repeat(Math.round(posada.rating))}</span>
              <span className="drw-rnum">{posada.rating}</span>
              <span className="drw-rrev">({posada.reviews} reseñas)</span>
              <span style={{color:'var(--muted)'}}>·</span>
              <span className="drw-rooms">{posada.habitaciones} hab.</span>
            </div>
          </div>
          <div className="drw-price-block">
            <span className="drw-price">${posada.precio}</span>
            <span className="drw-unit">/noche</span>
          </div>
        </div>

        <div className="drw-tags">
          {posada.tags.map(t=><span key={t} className="drw-tag">{t}</span>)}
        </div>

        <p className="drw-desc">{posada.descripcion}</p>

        <div className="drw-div"/>

        <div className="drw-sec-title">Selecciona tus fechas</div>
        <div className="drw-dates-bar" onClick={()=>setShowDates(v=>!v)}>
          <div className="drw-date-seg">
            <span className="drw-date-lbl">ENTRADA</span>
            <span className={`drw-date-val${!checkIn?' ph':''}`}>{checkIn?fmtDate(checkIn):'Agregar fecha'}</span>
          </div>
          <div style={{color:'var(--muted)',padding:'0 0.5rem',fontSize:'0.9rem'}}>→</div>
          <div className="drw-date-seg">
            <span className="drw-date-lbl">SALIDA</span>
            <span className={`drw-date-val${!checkOut?' ph':''}`}>{checkOut?fmtDate(checkOut):'Agregar fecha'}</span>
          </div>
          <div style={{marginLeft:'auto',paddingRight:'0.75rem',color:'var(--muted)',fontSize:'0.8rem'}}>
            {showDates?'▲':'▼'}
          </div>
        </div>
        {showDates && (
          <div style={{marginBottom:'0.5rem'}}>
            <Calendar checkIn={checkIn} checkOut={checkOut} onCheckIn={setCheckIn} onCheckOut={setCheckOut} compact/>
          </div>
        )}

        <div className="drw-div"/>

        <div className="drw-sec-title">Método de pago</div>
        <div className="drw-pay-sel" onClick={()=>setShowPago(v=>!v)}>
          <span className={pago?'':'ph'}>{pago||'Selecciona un método'}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        {showPago && (
          <div className="drw-pay-opts">
            {PAGO_OPTS.map(v=>(
              <div key={v} className={`drw-pay-opt${pago===v?' sel':''}`} onClick={()=>{setPago(v);setShowPago(false)}}>
                {v}{pago===v&&<span style={{color:'var(--cacao)',marginLeft:'auto'}}>✓</span>}
              </div>
            ))}
          </div>
        )}
        <div className="drw-accepted">
          {posada.metodoPago.map(m=><span key={m} className="drw-pay-badge">{m}</span>)}
        </div>

        <div className="drw-div"/>

        {nights>0 && (
          <div className="drw-price-summary">
            <div className="dps-row"><span>${posada.precio} × {nights} noche{nights>1?'s':''}</span><span>${total}</span></div>
            <div className="dps-total"><span>Total estimado</span><span>${total} USD</span></div>
          </div>
        )}

        <div className="drw-ctas">
          <button className="drw-btn-res" onClick={handleReserve}>
            {nights>0 ? `Reservar · $${total} USD` : 'Reservar ahora'}
          </button>
          <Link href={`/posadas/${posada.slug}`} className="drw-btn-det">
            Ver todos los detalles →
          </Link>
        </div>

        <div className="drw-host">
          <div className="drw-avatar">{posada.host.nombre[0]}</div>
          <div>
            <div className="drw-host-name">Anfitrión: {posada.host.nombre}</div>
            <div className="drw-host-info">Posadero desde {posada.host.desde} · {posada.host.idiomas.join(', ')}</div>
          </div>
        </div>
      </div>
    </>
  )
}

const PAY_OPTS = [
  {value:'',label:'Cualquier opción'},
  {value:'Zelle',label:'Zelle'},
  {value:'Transferencia',label:'Transferencia bancaria'},
  {value:'Efectivo USD',label:'Efectivo USD'},
  {value:'Efectivo Bs',label:'Efectivo Bs'},
  {value:'Tarjeta',label:'Tarjeta de crédito'},
]

function BuscarContent() {
  const searchParams = useSearchParams()

  const [query,      setQuery]      = useState(searchParams.get('q') || '')
  const [checkIn,    setCheckIn]    = useState<Date|null>(null)
  const [checkOut,   setCheckOut]   = useState<Date|null>(null)
  const [flexible,   setFlexible]   = useState(!!searchParams.get('flexible'))
  const [metodoPago, setMetodoPago] = useState(searchParams.get('pago') || '')
  const [precioMax,  setPrecioMax]  = useState(200)
  const [sort,       setSort]       = useState<'rating'|'precio'|'distancia'>('rating')

  const [showDate,    setShowDate]    = useState(false)
  const [showPay,     setShowPay]     = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSug,     setShowSug]     = useState(false)

  const [hoveredSlug,    setHoveredSlug]    = useState<string|null>(null)
  const [selectedPosada, setSelectedPosada] = useState<Posada|null>(null)
  const [mobileTab,      setMobileTab]      = useState<'lista'|'mapa'>('lista')

  const inputRef = useRef<HTMLInputElement>(null)
  const dateRef  = useRef<HTMLDivElement>(null)
  const payRef   = useRef<HTMLDivElement>(null)
  const sugRef   = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    function h(e:MouseEvent){
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setShowDate(false)
      if (payRef.current  && !payRef.current.contains(e.target as Node))  setShowPay(false)
      if (sugRef.current  && !sugRef.current.contains(e.target as Node) && e.target!==inputRef.current) setShowSug(false)
    }
    document.addEventListener('mousedown',h)
    return ()=>document.removeEventListener('mousedown',h)
  },[])

  useEffect(()=>{
    if (!query.trim()){setSuggestions([]);return}
    const q=query.toLowerCase()
    setSuggestions(
      venezuelaLocations
        .filter(l=>[l.nombre,...l.aliases].some(a=>a.toLowerCase().includes(q)))
        .slice(0,6).map(l=>l.nombre)
    )
  },[query])

  useEffect(()=>{
    function h(e:KeyboardEvent){ if(e.key==='Escape') setSelectedPosada(null) }
    document.addEventListener('keydown',h)
    return ()=>document.removeEventListener('keydown',h)
  },[])

  const opts: SearchOptions = { query, metodoPago, precioMax, sort }
  const results = searchPosadas(posadas, opts)
  const isProximity = results.some(r=>r.isProximity)
  const resolvedLoc = query ? resolveLocation(query) : null

  const dateLabel = flexible
    ? 'Fechas flexibles'
    : checkIn&&checkOut ? `${fmtDate(checkIn)} – ${fmtDate(checkOut)}`
    : checkIn ? `${fmtDate(checkIn)} – Salida` : 'Fechas'

  const sliderPct = ((precioMax-40)/(200-40))*100

  return (
    <>
      <style>{`
        :root{--indigo:#1A2B4C;--cacao:#E67E22;--cacao-dark:#C96510;--sand:#FDFBF7;--muted:#7A8699;--line:rgba(26,43,76,0.09);--sh:0 4px 24px rgba(26,43,76,0.10);--shl:0 16px 52px rgba(26,43,76,0.16);}
        *{margin:0;padding:0;box-sizing:border-box;}
        html,body{font-family:var(--font-inter),'Inter',sans-serif;background:var(--sand);color:var(--indigo);}
        .nav{position:sticky;top:0;z-index:80;display:flex;align-items:center;justify-content:space-between;padding:0.9rem 1.75rem;background:white;border-bottom:1px solid var(--line);}
        .logo{font-size:1.5rem;font-weight:800;letter-spacing:-0.04em;color:var(--indigo);text-decoration:none;}
        .logo span{color:var(--cacao);}
        .nav-links{display:flex;align-items:center;gap:1rem;}
        .nav-link{font-size:0.85rem;color:var(--muted);text-decoration:none;font-weight:500;transition:color 0.2s;}
        .nav-link:hover{color:var(--indigo);}
        .nav-cta{padding:0.58rem 1rem;border-radius:999px;font-size:0.82rem;font-weight:600;text-decoration:none;background:var(--cacao);color:white;}
        @media(max-width:768px){.nav-links{display:none;}}
        .sb-wrap{background:white;border-bottom:1px solid var(--line);padding:0.8rem 1.75rem;position:sticky;top:57px;z-index:70;}
        .sb-bar{display:flex;align-items:stretch;border:1.5px solid var(--line);border-radius:16px;background:white;box-shadow:var(--sh);max-width:860px;margin:0 auto;overflow:visible;position:relative;}
        .sb-seg{flex:1;position:relative;display:flex;flex-direction:column;justify-content:center;padding:0.62rem 1rem;border-right:1.5px solid var(--line);cursor:pointer;transition:background 0.17s;min-width:0;}
        .sb-seg:last-of-type{border-right:none;}
        .sb-seg:hover,.sb-seg.open{background:rgba(26,43,76,0.03);}
        .sb-seg.open{background:rgba(230,126,34,0.05);}
        .sb-lbl{font-size:0.6rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);margin-bottom:0.14rem;}
        .sb-val{font-size:0.86rem;font-weight:500;color:var(--indigo);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .sb-ph{color:var(--muted)!important;font-weight:400!important;}
        .sb-txt{border:none;outline:none;font-size:0.86rem;font-family:inherit;font-weight:500;color:var(--indigo);background:transparent;width:100%;padding:0;}
        .sb-txt::placeholder{color:var(--muted);font-weight:400;}
        .sb-go{flex-shrink:0;display:flex;align-items:center;gap:0.42rem;padding:0 1.05rem;margin:0.32rem;border-radius:12px;background:var(--cacao);color:white;border:none;font-size:0.86rem;font-weight:700;font-family:inherit;cursor:pointer;transition:all 0.18s;white-space:nowrap;min-height:40px;}
        .sb-go:hover{background:var(--cacao-dark);}
        @media(max-width:680px){.sb-bar{flex-direction:column;border-radius:18px;}.sb-seg{border-right:none;border-bottom:1.5px solid var(--line);}.sb-seg:last-of-type{border-bottom:none;}.sb-go{margin:0.38rem;justify-content:center;}}
        .sb-drop{position:absolute;top:calc(100% + 9px);left:0;background:white;border:1.5px solid var(--line);border-radius:16px;box-shadow:var(--shl);z-index:300;overflow:hidden;min-width:230px;}
        .sb-sug-row{display:flex;align-items:center;gap:0.65rem;padding:0.75rem 1rem;font-size:0.86rem;color:var(--indigo);cursor:pointer;transition:background 0.13s;}
        .sb-sug-row:hover{background:rgba(26,43,76,0.04);}
        .sb-sug-reg{font-size:0.71rem;color:var(--muted);margin-left:auto;padding-left:0.35rem;white-space:nowrap;}
        .sb-date-drop{position:absolute;top:calc(100% + 9px);left:50%;transform:translateX(-50%);background:white;border:1.5px solid var(--line);border-radius:20px;box-shadow:var(--shl);z-index:300;padding:1.05rem;min-width:min(620px,90vw);}
        @media(max-width:620px){.sb-date-drop{left:0;transform:none;min-width:calc(100vw - 2rem);}}
        .sb-modes{display:flex;gap:0.32rem;background:rgba(26,43,76,0.05);border-radius:999px;padding:0.24rem;margin-bottom:0.9rem;}
        .sb-mode{flex:1;padding:0.43rem;border-radius:999px;font-size:0.8rem;font-weight:600;font-family:inherit;border:none;background:transparent;color:var(--muted);cursor:pointer;transition:all 0.17s;}
        .sb-mode.on{background:white;color:var(--indigo);box-shadow:0 2px 7px rgba(0,0,0,0.08);}
        .sb-pay-drop{position:absolute;top:calc(100% + 9px);right:0;left:auto;background:white;border:1.5px solid var(--line);border-radius:16px;box-shadow:var(--shl);z-index:300;min-width:210px;overflow:hidden;}
        .sb-pay-row{display:flex;align-items:center;justify-content:space-between;padding:0.76rem 1.1rem;font-size:0.86rem;font-weight:500;color:var(--indigo);cursor:pointer;transition:background 0.13s;gap:0.45rem;}
        .sb-pay-row:hover{background:rgba(26,43,76,0.04);}
        .sb-pay-row.sel{color:var(--cacao);font-weight:700;}
        .cal-wrap{padding:0.15rem 0;}
        .cal-nav{display:flex;align-items:center;margin-bottom:0.62rem;}
        .cal-nav-btn{width:28px;height:28px;border-radius:50%;border:1.5px solid var(--line);background:white;color:var(--indigo);font-size:0.95rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.16s;flex-shrink:0;}
        .cal-nav-btn:hover{background:var(--indigo);color:white;border-color:var(--indigo);}
        .cal-double{display:grid;grid-template-columns:1fr 1fr;gap:1.1rem;}
        .cal-single{display:grid;grid-template-columns:1fr;}
        @media(max-width:520px){.cal-double{grid-template-columns:1fr;}}
        .cal-mname{font-size:0.85rem;font-weight:700;color:var(--indigo);text-align:center;margin-bottom:0.55rem;}
        .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;}
        .cal-dname{font-size:0.62rem;font-weight:600;color:var(--muted);text-align:center;padding:0.16rem 0;}
        .cal-day{aspect-ratio:1;border-radius:50%;border:none;background:transparent;font-size:0.78rem;font-weight:500;color:var(--indigo);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.12s;}
        .cal-day:hover:not(.dis){background:rgba(26,43,76,0.07);}
        .cal-day.dis{color:rgba(26,43,76,0.22);cursor:default;}
        .cal-day.st,.cal-day.en{background:var(--indigo)!important;color:white!important;font-weight:700;}
        .cal-day.rng{background:rgba(26,43,76,0.08);border-radius:0;}
        .cal-day.rl{border-radius:50% 0 0 50%;}
        .cal-day.rr{border-radius:0 50% 50% 0;}
        .cal-day.hov{background:rgba(26,43,76,0.05);}
        .cal-footer{display:flex;align-items:center;justify-content:space-between;margin-top:0.85rem;padding-top:0.85rem;border-top:1px solid var(--line);}
        .cal-summary{font-size:0.8rem;color:var(--muted);}
        .cal-clear{font-size:0.78rem;font-weight:600;color:var(--indigo);background:none;border:none;cursor:pointer;font-family:inherit;text-decoration:underline;}
        .page-wrap{display:flex;height:calc(100dvh - 57px - 62px);}
        .list-col{width:52%;min-width:310px;overflow-y:auto;padding:1.05rem 1.2rem 5rem;scrollbar-width:thin;scrollbar-color:rgba(26,43,76,0.15) transparent;}
        .map-col{flex:1;padding:0.65rem;background:var(--sand);}
        .map-inner{width:100%;height:100%;border-radius:20px;overflow:hidden;box-shadow:var(--sh);}
        @media(max-width:860px){.page-wrap{height:auto;flex-direction:column;}.list-col{width:100%;overflow-y:visible;padding:1rem 1rem 5rem;}.map-col{display:none;height:60vw;max-height:460px;}.map-col.show{display:block;}.list-col.hide{display:none;}}
        .m-tabs{display:none;position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);background:var(--indigo);border-radius:999px;padding:0.32rem;gap:0.18rem;box-shadow:0 8px 28px rgba(26,43,76,0.35);z-index:50;}
        .m-tab{padding:0.52rem 1.15rem;border-radius:999px;font-size:0.81rem;font-weight:600;font-family:inherit;border:none;cursor:pointer;transition:all 0.18s;color:rgba(255,255,255,0.52);background:transparent;display:flex;align-items:center;gap:0.3rem;}
        .m-tab.on{background:white;color:var(--indigo);}
        @media(max-width:860px){.m-tabs{display:flex;}}
        .price-box{background:white;border:1.5px solid var(--line);border-radius:14px;padding:0.88rem 1.1rem;margin-bottom:1rem;}
        .price-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:0.52rem;}
        .price-lbl{font-size:0.69rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);}
        .price-val{font-size:0.92rem;font-weight:800;color:var(--indigo);}
        .price-val small{font-size:0.68rem;font-weight:400;color:var(--muted);}
        .sl-wrap{position:relative;}
        .sl-track{position:absolute;top:50%;transform:translateY(-50%);left:0;height:3px;border-radius:3px;pointer-events:none;background:linear-gradient(to right,var(--cacao) ${sliderPct}%,rgba(26,43,76,0.12) ${sliderPct}%);width:100%;}
        .slider{width:100%;appearance:none;-webkit-appearance:none;background:transparent;height:20px;cursor:pointer;position:relative;z-index:1;}
        .slider::-webkit-slider-thumb{-webkit-appearance:none;width:17px;height:17px;border-radius:50%;background:var(--cacao);border:3px solid white;box-shadow:0 2px 7px rgba(230,126,34,0.35);cursor:pointer;}
        .slider::-moz-range-thumb{width:17px;height:17px;border-radius:50%;background:var(--cacao);border:3px solid white;box-shadow:0 2px 7px rgba(230,126,34,0.35);}
        .price-ends{display:flex;justify-content:space-between;font-size:0.66rem;color:var(--muted);margin-top:0.1rem;}
        .res-hdr{margin-bottom:0.88rem;}
        .res-count{font-size:0.82rem;color:var(--muted);margin-bottom:0.62rem;}
        .res-count strong{color:var(--indigo);font-weight:700;}
        .sort-row{display:flex;align-items:center;gap:0.32rem;flex-wrap:wrap;}
        .sort-lbl{font-size:0.72rem;color:var(--muted);}
        .sort-chip{padding:0.3rem 0.72rem;border-radius:999px;font-size:0.76rem;font-weight:600;font-family:inherit;border:1.5px solid var(--line);background:white;color:var(--muted);cursor:pointer;transition:all 0.16s;}
        .sort-chip.on{background:var(--indigo);color:white;border-color:var(--indigo);}
        .sort-chip:hover:not(.on){border-color:rgba(26,43,76,0.2);color:var(--indigo);}
        .prox-box{display:flex;align-items:flex-start;gap:0.68rem;background:rgba(230,126,34,0.07);border:1.5px solid rgba(230,126,34,0.2);border-radius:13px;padding:0.82rem 0.95rem;margin-bottom:0.95rem;}
        .prox-icon{font-size:1.15rem;flex-shrink:0;}
        .prox-txt p{font-size:0.86rem;font-weight:600;color:var(--indigo);margin-bottom:0.13rem;}
        .prox-txt span{font-size:0.78rem;color:var(--muted);}
        .cards{display:flex;flex-direction:column;gap:0.85rem;}
        .card{background:white;border:1.5px solid var(--line);border-radius:17px;overflow:hidden;display:flex;box-shadow:var(--sh);transition:all 0.24s;cursor:pointer;}
        .card:hover,.card.hov{box-shadow:var(--shl);transform:translateY(-2px);border-color:rgba(230,126,34,0.25);}
        .c-img{width:148px;flex-shrink:0;position:relative;overflow:hidden;}
        .c-img img{width:100%;height:100%;object-fit:cover;transition:transform 0.42s;display:block;}
        .card:hover .c-img img,.card.hov .c-img img{transform:scale(1.06);}
        .c-tipo{position:absolute;top:0.52rem;left:0.52rem;background:rgba(26,43,76,0.72);color:white;font-size:0.59rem;font-weight:700;letter-spacing:0.04em;padding:0.2rem 0.52rem;border-radius:999px;backdrop-filter:blur(3px);}
        .c-body{flex:1;padding:0.92rem 1rem;display:flex;flex-direction:column;min-width:0;}
        .c-top{display:flex;justify-content:space-between;align-items:flex-start;gap:0.4rem;margin-bottom:0.26rem;}
        .c-name{font-family:var(--font-playfair),'Playfair Display',Georgia,serif;font-size:0.98rem;font-weight:700;color:var(--indigo);line-height:1.28;}
        .c-price{flex-shrink:0;background:var(--indigo);color:white;font-size:0.78rem;font-weight:800;border-radius:9px;padding:0.26rem 0.58rem;white-space:nowrap;}
        .c-stars{font-size:0.77rem;color:#F59E0B;}
        .c-rnum{font-size:0.79rem;font-weight:700;color:var(--indigo);}
        .c-rrev{font-size:0.72rem;color:var(--muted);}
        .c-tags{display:flex;gap:0.26rem;flex-wrap:wrap;margin:0.42rem 0;}
        .ctag{font-size:0.65rem;padding:0.17rem 0.46rem;border-radius:999px;border:1px solid var(--line);color:var(--muted);}
        .c-foot{display:flex;align-items:center;justify-content:space-between;margin-top:auto;}
        .c-dist{font-size:0.72rem;color:var(--muted);display:flex;align-items:center;gap:0.26rem;}
        .c-cta{font-size:0.77rem;font-weight:700;color:var(--cacao);}
        .c-pay{display:flex;gap:0.23rem;flex-wrap:wrap;margin-top:0.35rem;}
        .ptag{font-size:0.64rem;background:rgba(26,43,76,0.05);padding:0.12rem 0.38rem;border-radius:6px;color:var(--muted);}
        @media(max-width:500px){.card{flex-direction:column;}.c-img{width:100%;height:145px;}}
        .empty{text-align:center;padding:3.5rem 1.5rem;}
        .empty p{font-size:1.02rem;font-weight:700;color:var(--indigo);margin-bottom:0.32rem;}
        .empty span{font-size:0.84rem;color:var(--muted);}
        .drw-overlay{position:fixed;inset:0;background:rgba(15,27,48,0.48);z-index:400;backdrop-filter:blur(4px);display:flex;justify-content:flex-end;}
        @media(max-width:660px){.drw-overlay{align-items:flex-end;}}
        .drw{background:white;width:min(450px,96vw);height:100dvh;display:flex;flex-direction:column;box-shadow:-20px 0 80px rgba(0,0,0,0.18);animation:drwIn 0.28s cubic-bezier(0.16,1,0.3,1) both;overflow:hidden;position:relative;}
        @media(max-width:660px){.drw{width:100%;height:90dvh;border-radius:20px 20px 0 0;animation:drwUp 0.28s cubic-bezier(0.16,1,0.3,1) both;}}
        @keyframes drwIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes drwUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        .drw-close{position:absolute;top:0.85rem;right:0.85rem;z-index:10;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.92);border:1px solid rgba(0,0,0,0.1);backdrop-filter:blur(6px);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,0.14);transition:all 0.18s;}
        .drw-close:hover{transform:scale(1.08);background:white;}
        .drw-gal{flex-shrink:0;height:220px;position:relative;overflow:hidden;}
        .drw-img{width:100%;height:100%;object-fit:cover;display:block;}
        .drw-dots{position:absolute;bottom:0.65rem;left:50%;transform:translateX(-50%);display:flex;gap:0.32rem;}
        .drw-dot{width:6px;height:6px;border-radius:50%;border:none;background:rgba(255,255,255,0.48);cursor:pointer;padding:0;transition:all 0.2s;}
        .drw-dot.on{background:white;width:16px;border-radius:3px;}
        .drw-arrow{position:absolute;top:50%;transform:translateY(-50%);width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,0.9);border:none;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.14);transition:all 0.16s;}
        .drw-arrow:hover{background:white;transform:translateY(-50%) scale(1.08);}
        .drw-arrow.left{left:0.65rem;}
        .drw-arrow.right{right:0.65rem;}
        .drw-tipo-badge{position:absolute;bottom:0.65rem;left:0.7rem;background:rgba(26,43,76,0.72);color:white;font-size:0.62rem;font-weight:700;padding:0.22rem 0.6rem;border-radius:999px;backdrop-filter:blur(3px);}
        .drw-body{flex:1;overflow-y:auto;padding:1.15rem 1.3rem 2rem;scrollbar-width:thin;scrollbar-color:rgba(26,43,76,0.15) transparent;}
        .drw-header{display:flex;align-items:flex-start;justify-content:space-between;gap:0.7rem;margin-bottom:0.6rem;}
        .drw-name{font-family:var(--font-playfair),'Playfair Display',Georgia,serif;font-size:1.2rem;font-weight:700;color:var(--indigo);line-height:1.2;}
        .drw-meta{display:flex;align-items:center;gap:0.38rem;margin-top:0.32rem;flex-wrap:wrap;}
        .drw-stars{font-size:0.78rem;color:#F59E0B;}
        .drw-rnum{font-size:0.81rem;font-weight:700;color:var(--indigo);}
        .drw-rrev,.drw-rooms{font-size:0.75rem;color:var(--muted);}
        .drw-price-block{text-align:right;flex-shrink:0;}
        .drw-price{font-size:1.45rem;font-weight:800;color:var(--indigo);display:block;}
        .drw-unit{font-size:0.74rem;color:var(--muted);}
        .drw-tags{display:flex;gap:0.28rem;flex-wrap:wrap;margin-bottom:0.7rem;}
        .drw-tag{font-size:0.67rem;padding:0.18rem 0.5rem;border-radius:999px;border:1px solid var(--line);color:var(--muted);}
        .drw-desc{font-size:0.84rem;color:var(--muted);line-height:1.62;}
        .drw-div{height:1px;background:var(--line);margin:1rem 0;}
        .drw-sec-title{font-size:0.78rem;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:var(--muted);margin-bottom:0.65rem;}
        .drw-dates-bar{display:flex;align-items:center;border:1.5px solid var(--line);border-radius:13px;overflow:hidden;cursor:pointer;transition:border-color 0.2s;margin-bottom:0.65rem;}
        .drw-dates-bar:hover{border-color:rgba(230,126,34,0.38);}
        .drw-date-seg{flex:1;padding:0.7rem 0.85rem;}
        .drw-date-lbl{font-size:0.58rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:0.15rem;}
        .drw-date-val{font-size:0.86rem;font-weight:600;color:var(--indigo);}
        .drw-date-val.ph{color:var(--muted);font-weight:400;}
        .drw-pay-sel{display:flex;align-items:center;justify-content:space-between;border:1.5px solid var(--line);border-radius:12px;padding:0.76rem 0.95rem;cursor:pointer;font-size:0.85rem;font-weight:500;color:var(--indigo);transition:border-color 0.2s;margin-bottom:0.48rem;}
        .drw-pay-sel:hover{border-color:rgba(230,126,34,0.38);}
        .drw-pay-sel .ph{color:var(--muted);font-weight:400;}
        .drw-pay-opts{background:white;border:1.5px solid var(--line);border-radius:12px;overflow:hidden;margin-bottom:0.55rem;}
        .drw-pay-opt{display:flex;align-items:center;padding:0.72rem 0.95rem;font-size:0.84rem;color:var(--indigo);cursor:pointer;transition:background 0.12s;}
        .drw-pay-opt:hover{background:rgba(26,43,76,0.04);}
        .drw-pay-opt.sel{color:var(--cacao);font-weight:700;}
        .drw-accepted{display:flex;gap:0.28rem;flex-wrap:wrap;margin-bottom:0.2rem;}
        .drw-pay-badge{font-size:0.66rem;background:rgba(26,43,76,0.05);padding:0.16rem 0.46rem;border-radius:7px;color:var(--muted);}
        .drw-price-summary{background:rgba(26,43,76,0.03);border-radius:12px;padding:0.85rem;margin-bottom:0.95rem;}
        .dps-row{display:flex;justify-content:space-between;font-size:0.84rem;color:var(--muted);margin-bottom:0.38rem;}
        .dps-total{display:flex;justify-content:space-between;font-size:0.93rem;font-weight:700;color:var(--indigo);padding-top:0.48rem;border-top:1px solid var(--line);}
        .drw-ctas{display:flex;flex-direction:column;gap:0.6rem;margin-bottom:1rem;}
        .drw-btn-res{width:100%;padding:0.95rem;border-radius:13px;background:var(--cacao);color:white;border:none;font-size:0.93rem;font-weight:700;font-family:inherit;cursor:pointer;box-shadow:0 7px 22px rgba(230,126,34,0.27);transition:all 0.2s;}
        .drw-btn-res:hover{background:var(--cacao-dark);transform:translateY(-1px);}
        .drw-btn-det{display:block;text-align:center;padding:0.82rem;border-radius:13px;border:1.5px solid var(--line);color:var(--indigo);text-decoration:none;font-size:0.85rem;font-weight:600;transition:all 0.18s;}
        .drw-btn-det:hover{border-color:var(--indigo);background:rgba(26,43,76,0.03);}
        .drw-host{display:flex;align-items:center;gap:0.8rem;background:rgba(26,43,76,0.03);border-radius:12px;padding:0.82rem;}
        .drw-avatar{width:38px;height:38px;border-radius:50%;background:var(--indigo);color:white;display:flex;align-items:center;justify-content:center;font-size:0.95rem;font-weight:700;flex-shrink:0;}
        .drw-host-name{font-size:0.84rem;font-weight:600;color:var(--indigo);}
        .drw-host-info{font-size:0.74rem;color:var(--muted);margin-top:0.12rem;}
      `}</style>

      <nav className="nav">
        <Link href="/" className="logo">RESER<span>-VE</span></Link>
        <div className="nav-links">
          <Link href="/buscar" className="nav-link">Destinos</Link>
          <Link href="/registro-posada" className="nav-link">Posaderos</Link>
          <Link href="/#como-funciona" className="nav-link">Cómo funciona</Link>
          <Link href="/registro-posada" className="nav-cta">Registra tu posada</Link>
        </div>
      </nav>

      <div className="sb-wrap">
        <div className="sb-bar">
          <div className="sb-seg" style={{flex:'1.6'}}>
            <div className="sb-lbl">Destino</div>
            <input ref={inputRef} className="sb-txt" placeholder="¿A dónde vas?" value={query}
              onChange={e=>{setQuery(e.target.value);setShowSug(true)}}
              onFocus={()=>setShowSug(true)} autoComplete="off"/>
            {showSug && suggestions.length>0 && (
              <div className="sb-drop" ref={sugRef}>
                {suggestions.map(s=>{
                  const loc=venezuelaLocations.find(l=>l.nombre===s)
                  return (
                    <div key={s} className="sb-sug-row" onMouseDown={()=>{setQuery(s);setShowSug(false)}}>
                      <span>📍</span><span>{s}</span>
                      {loc&&<span className="sb-sug-reg">{loc.region}</span>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className={`sb-seg${showDate?' open':''}`} style={{flex:'1.3'}} ref={dateRef}
            onClick={()=>{setShowDate(v=>!v);setShowPay(false)}}>
            <div className="sb-lbl">Fechas</div>
            <div className={`sb-val${!checkIn&&!flexible?' sb-ph':''}`}>{dateLabel}</div>
            {showDate && (
              <div className="sb-date-drop" onClick={e=>e.stopPropagation()}>
                <div className="sb-modes">
                  <button className={`sb-mode${!flexible?' on':''}`} onClick={()=>setFlexible(false)}>Fechas exactas</button>
                  <button className={`sb-mode${flexible?' on':''}`} onClick={()=>{setFlexible(true);setCheckIn(null);setCheckOut(null);setTimeout(()=>setShowDate(false),140)}}>Fechas flexibles</button>
                </div>
                {!flexible && <Calendar checkIn={checkIn} checkOut={checkOut} onCheckIn={setCheckIn} onCheckOut={setCheckOut}/>}
              </div>
            )}
          </div>

          <div className={`sb-seg${showPay?' open':''}`} ref={payRef}
            onClick={()=>{setShowPay(v=>!v);setShowDate(false)}}>
            <div className="sb-lbl">Pago</div>
            <div className={`sb-val${!metodoPago?' sb-ph':''}`}>{metodoPago||'Cualquier opción'}</div>
            {showPay && (
              <div className="sb-pay-drop" onClick={e=>e.stopPropagation()}>
                {PAY_OPTS.map(({value,label})=>(
                  <div key={value} className={`sb-pay-row${metodoPago===value?' sel':''}`}
                    onMouseDown={()=>{setMetodoPago(value);setShowPay(false)}}>
                    {label}{metodoPago===value&&<span style={{marginLeft:'auto',color:'var(--cacao)'}}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="sb-go" onClick={()=>{setShowSug(false);setShowDate(false);setShowPay(false)}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Buscar
          </button>
        </div>
      </div>

      <div className="page-wrap">
        <div className={`list-col${mobileTab==='mapa'?' hide':''}`}>
          <div className="price-box">
            <div className="price-row">
              <span className="price-lbl">Precio máximo / noche</span>
              <span className="price-val">${precioMax} <small>USD</small></span>
            </div>
            <div className="sl-wrap">
              <div className="sl-track"/>
              <input type="range" className="slider" min={40} max={200} step={5} value={precioMax} onChange={e=>setPrecioMax(Number(e.target.value))}/>
            </div>
            <div className="price-ends"><span>$40</span><span>$200+</span></div>
          </div>

          <div className="res-hdr">
            <p className="res-count">
              <strong>{results.length}</strong> posada{results.length!==1?'s':''} encontrada{results.length!==1?'s':''}
              {query&&resolvedLoc&&` cerca de ${resolvedLoc.location.nombre}`}
            </p>
            <div className="sort-row">
              <span className="sort-lbl">Ordenar:</span>
              {([{v:'rating',l:'Valoración'},{v:'precio',l:'Precio'},...(results.some(r=>r.distanceKm!==null)?[{v:'distancia',l:'Distancia'}]:[])] as {v:string,l:string}[]).map(({v,l})=>(
                <button key={v} className={`sort-chip${sort===v?' on':''}`} onClick={()=>setSort(v as any)}>{l}</button>
              ))}
            </div>
          </div>

          {isProximity&&query&&(
            <div className="prox-box">
              <div className="prox-icon">🧭</div>
              <div className="prox-txt">
                <p>No hay posadas exactas en "{query}"</p>
                <span>Mostrando las más cercanas{resolvedLoc?` a ${resolvedLoc.location.nombre}`:''}</span>
              </div>
            </div>
          )}

          {results.length===0 ? (
            <div className="empty"><p>Sin resultados</p><span>Prueba con otro destino o ajusta los filtros</span></div>
          ) : (
            <div className="cards">
              {results.map(({posada:p,distanceKm,isProximity:isProx})=>(
                <div key={p.slug}
                  className={`card${hoveredSlug===p.slug?' hov':''}`}
                  onMouseEnter={()=>setHoveredSlug(p.slug)}
                  onMouseLeave={()=>setHoveredSlug(null)}
                  onClick={()=>setSelectedPosada(p)}
                >
                  <div className="c-img">
                    <img src={p.imgs[0]} alt={p.nombre} loading="lazy"/>
                    <div className="c-tipo">{p.tipo}</div>
                  </div>
                  <div className="c-body">
                    <div className="c-top">
                      <div className="c-name">{p.nombre}</div>
                      <div className="c-price">${p.precio}<span style={{fontWeight:400,fontSize:'0.66rem'}}>/noche</span></div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'0.38rem'}}>
                      <span className="c-stars">{'★'.repeat(Math.round(p.rating))}</span>
                      <span className="c-rnum">{p.rating}</span>
                      <span className="c-rrev">({p.reviews})</span>
                    </div>
                    <div className="c-tags">{p.tags.map(t=><span key={t} className="ctag">{t}</span>)}</div>
                    <div className="c-pay">{p.metodoPago.map(m=><span key={m} className="ptag">{m}</span>)}</div>
                    <div className="c-foot">
                      <div className="c-dist">
                        {distanceKm!==null
                          ? <><span style={{color:'var(--cacao)'}}>📍</span>{distanceKm<10?`${Math.round(distanceKm*10)/10}`:`${Math.round(distanceKm)}`} km{isProx?' (zona cercana)':''}</>
                          : <span>{p.destino}</span>}
                      </div>
                      <span className="c-cta">Ver detalles →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`map-col${mobileTab==='mapa'?' show':''}`}>
          <div className="map-inner">
            <MapView
              results={results}
              hoveredSlug={hoveredSlug}
              onHover={setHoveredSlug}
              onSelect={slug=>{
                const p=posadas.find(x=>x.slug===slug)
                if (p) setSelectedPosada(p)
              }}
            />
          </div>
        </div>
      </div>

      <div className="m-tabs">
        <button className={`m-tab${mobileTab==='lista'?' on':''}`} onClick={()=>setMobileTab('lista')}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="4" width="18" height="2.5" rx="1"/><rect x="3" y="10.75" width="18" height="2.5" rx="1"/><rect x="3" y="17.5" width="18" height="2.5" rx="1"/></svg>
          Lista
        </button>
        <button className={`m-tab${mobileTab==='mapa'?' on':''}`} onClick={()=>setMobileTab('mapa')}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg>
          Mapa
        </button>
      </div>

      {selectedPosada && (
        <div className="drw-overlay" onClick={()=>setSelectedPosada(null)}>
          <div className="drw" onClick={e=>e.stopPropagation()}>
            <PosadaDrawer posada={selectedPosada} onClose={()=>setSelectedPosada(null)}/>
          </div>
        </div>
      )}
    </>
  )
}

export default function Buscar() {
  return (
    <Suspense fallback={
      <div style={{minHeight:'100dvh',background:'#FDFBF7',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'inherit',color:'#1A2B4C',fontSize:'0.9rem'}}>
        Cargando…
      </div>
    }>
      <BuscarContent/>
    </Suspense>
  )
}
