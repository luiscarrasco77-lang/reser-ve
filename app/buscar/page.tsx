'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { posadas } from '@/lib/data'
import { venezuelaLocations } from '@/lib/locations-ve'
import { searchPosadas, resolveLocation, type SearchResult, type SearchOptions } from '@/lib/search'

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', background: '#E8EDF0', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#7A8699', fontFamily: 'Inter,sans-serif', fontSize: '0.9rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗺️</div>
        Cargando mapa…
      </div>
    </div>
  ),
})

// ─── Date helpers ────────────────────────────────────────────────────────────
function formatDate(d: Date | null): string {
  if (!d) return ''
  return d.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isInRange(d: Date, start: Date | null, end: Date | null) {
  if (!start || !end) return false
  return d > start && d < end
}

function addMonths(d: Date, n: number) {
  const r = new Date(d)
  r.setMonth(r.getMonth() + n)
  return r
}

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DAY_NAMES = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']

// ─── Mini Calendar ───────────────────────────────────────────────────────────
function MiniCalendar({
  month, year, checkIn, checkOut, hoverDate,
  onDayClick, onDayHover,
}: {
  month: number; year: number
  checkIn: Date | null; checkOut: Date | null; hoverDate: Date | null
  onDayClick: (d: Date) => void
  onDayHover: (d: Date | null) => void
}) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = firstDay.getDay()
  const cells: (Date | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d))

  const endRange = checkOut || hoverDate

  return (
    <div className="cal-month">
      <div className="cal-month-name">{MONTH_NAMES[month]} {year}</div>
      <div className="cal-grid">
        {DAY_NAMES.map(d => <div key={d} className="cal-day-name">{d}</div>)}
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} />
          const isPast = date < today
          const isStart = checkIn && isSameDay(date, checkIn)
          const isEnd = checkOut && isSameDay(date, checkOut)
          const inRange = isInRange(date, checkIn, endRange)
          const isHoverEnd = hoverDate && !checkOut && isSameDay(date, hoverDate)
          const disabled = isPast

          let cls = 'cal-day'
          if (disabled) cls += ' disabled'
          if (isStart) cls += ' start'
          if (isEnd) cls += ' end'
          if (inRange) cls += ' in-range'
          if (isHoverEnd && !isEnd) cls += ' hover-end'
          if ((isStart && checkOut) || isEnd) {
            if (isStart && !isEnd) cls += ' range-left'
            if (isEnd && !isStart) cls += ' range-right'
          }

          return (
            <button
              key={date.toISOString()}
              className={cls}
              disabled={disabled}
              onClick={() => onDayClick(date)}
              onMouseEnter={() => onDayHover(date)}
              onMouseLeave={() => onDayHover(null)}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Date Picker Panel ───────────────────────────────────────────────────────
function DatePickerPanel({
  checkIn, checkOut, flexible,
  onCheckIn, onCheckOut, onFlexible, onClose,
}: {
  checkIn: Date | null; checkOut: Date | null; flexible: boolean
  onCheckIn: (d: Date | null) => void
  onCheckOut: (d: Date | null) => void
  onFlexible: (v: boolean) => void
  onClose: () => void
}) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const [viewMonth, setViewMonth] = useState(() => {
    const d = checkIn || today
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [hoverDate, setHoverDate] = useState<Date | null>(null)
  const [step, setStep] = useState<'in' | 'out'>(checkIn ? 'out' : 'in')

  const nextMonth = addMonths(viewMonth, 1)

  function handleDayClick(date: Date) {
    if (step === 'in' || !checkIn || date <= checkIn) {
      onCheckIn(date)
      onCheckOut(null)
      setStep('out')
    } else {
      onCheckOut(date)
      setStep('in')
      setTimeout(onClose, 300)
    }
  }

  function handleClear() {
    onCheckIn(null)
    onCheckOut(null)
    setStep('in')
  }

  const nights = checkIn && checkOut
    ? Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000)
    : 0

  return (
    <div className="datepicker-panel">
      <div className="datepicker-modes">
        <button
          className={`datepicker-mode-btn ${!flexible ? 'active' : ''}`}
          onClick={() => onFlexible(false)}
        >
          Fechas exactas
        </button>
        <button
          className={`datepicker-mode-btn ${flexible ? 'active' : ''}`}
          onClick={() => { onFlexible(true); handleClear(); setTimeout(onClose, 150) }}
        >
          Fechas flexibles
        </button>
      </div>

      {!flexible && (
        <>
          <div className="cal-nav">
            <button className="cal-nav-btn" onClick={() => setViewMonth(m => addMonths(m, -1))}>‹</button>
            <div className="cal-nav-spacer" />
            <button className="cal-nav-btn" onClick={() => setViewMonth(m => addMonths(m, 1))}>›</button>
          </div>
          <div className="cal-two-months">
            <MiniCalendar
              month={viewMonth.getMonth()} year={viewMonth.getFullYear()}
              checkIn={checkIn} checkOut={checkOut} hoverDate={hoverDate}
              onDayClick={handleDayClick} onDayHover={setHoverDate}
            />
            <MiniCalendar
              month={nextMonth.getMonth()} year={nextMonth.getFullYear()}
              checkIn={checkIn} checkOut={checkOut} hoverDate={hoverDate}
              onDayClick={handleDayClick} onDayHover={setHoverDate}
            />
          </div>
          <div className="datepicker-footer">
            <div className="datepicker-summary">
              {nights > 0
                ? `${nights} noche${nights > 1 ? 's' : ''}: ${formatDate(checkIn)} – ${formatDate(checkOut)}`
                : step === 'in' ? 'Selecciona fecha de entrada' : 'Selecciona fecha de salida'}
            </div>
            <button className="datepicker-clear" onClick={handleClear}>Borrar</button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Payment options ─────────────────────────────────────────────────────────
const PAYMENT_OPTIONS = [
  { value: '', label: 'Cualquier opción' },
  { value: 'Zelle', label: 'Zelle' },
  { value: 'Transferencia', label: 'Transferencia bancaria' },
  { value: 'Efectivo USD', label: 'Efectivo USD' },
  { value: 'Efectivo Bs', label: 'Efectivo Bs' },
  { value: 'Tarjeta', label: 'Tarjeta de crédito' },
]

// ─── Main Search Component ───────────────────────────────────────────────────
function BuscarContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [checkIn, setCheckIn] = useState<Date | null>(null)
  const [checkOut, setCheckOut] = useState<Date | null>(null)
  const [flexible, setFlexible] = useState(false)
  const [metodoPago, setMetodoPago] = useState('')
  const [precioMax, setPrecioMax] = useState(200)
  const [sort, setSort] = useState<'rating' | 'precio' | 'distancia'>('rating')

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)
  const [mobileTab, setMobileTab] = useState<'lista' | 'mapa'>('lista')

  const inputRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLDivElement>(null)
  const paymentRef = useRef<HTMLDivElement>(null)
  const suggestRef = useRef<HTMLDivElement>(null)

  // Close panels on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setShowDatePicker(false)
      if (paymentRef.current && !paymentRef.current.contains(e.target as Node)) setShowPayment(false)
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node) && e.target !== inputRef.current) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Autocomplete suggestions
  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return }
    const q = query.toLowerCase()
    const matches = venezuelaLocations
      .filter(l => {
        const haystack = [l.nombre, ...l.aliases].join(' ').toLowerCase()
        return haystack.includes(q) || l.nombre.toLowerCase().startsWith(q)
      })
      .slice(0, 6)
      .map(l => l.nombre)
    setSuggestions(matches)
  }, [query])

  // Compute results
  const opts: SearchOptions = { query, metodoPago, precioMax, sort }
  const results = searchPosadas(posadas, opts)
  const isProximity = results.some(r => r.isProximity)
  const resolvedLoc = query ? resolveLocation(query) : null

  // Date display
  const dateLabel = flexible
    ? 'Fechas flexibles'
    : checkIn && checkOut
      ? `${formatDate(checkIn)} – ${formatDate(checkOut)}`
      : checkIn
        ? `${formatDate(checkIn)} – Salida`
        : 'Fechas'

  const sliderPct = ((precioMax - 40) / (200 - 40)) * 100

  return (
    <>
      <style>{`
        :root {
          --indigo:#1A2B4C; --cacao:#E67E22; --cacao-dark:#C96510;
          --sand:#FDFBF7; --cream:#F5EFE0; --text:#1A2B4C;
          --muted:#7A8699; --line:rgba(26,43,76,0.09);
          --shadow:0 4px 24px rgba(26,43,76,0.10);
          --shadow-lg:0 12px 48px rgba(26,43,76,0.14);
        }
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:var(--font-inter),'Inter',sans-serif;background:var(--sand);color:var(--text);min-height:100dvh;}

        /* NAV */
        .nav{position:sticky;top:0;z-index:80;display:flex;align-items:center;justify-content:space-between;padding:0.9rem 1.75rem;background:white;border-bottom:1px solid var(--line);box-shadow:0 1px 12px rgba(26,43,76,0.06);}
        .logo{font-size:1.5rem;font-weight:800;letter-spacing:-0.04em;color:var(--indigo);text-decoration:none;}
        .logo span{color:var(--cacao);}
        .nav-links{display:flex;align-items:center;gap:1rem;}
        .nav-link{font-size:0.86rem;color:var(--muted);text-decoration:none;font-weight:500;transition:color 0.2s;}
        .nav-link:hover{color:var(--indigo);}
        .nav-cta{padding:0.6rem 1rem;border-radius:999px;font-size:0.83rem;font-weight:600;text-decoration:none;background:var(--cacao);color:white;transition:all 0.2s;}
        .nav-cta:hover{background:var(--cacao-dark);}
        @media(max-width:768px){.nav-links{display:none;}}

        /* SEARCH BAR */
        .search-bar-wrap{background:white;border-bottom:1px solid var(--line);padding:1rem 1.75rem;position:sticky;top:57px;z-index:70;}
        .search-bar{display:flex;align-items:stretch;border:1.5px solid var(--line);border-radius:16px;background:white;box-shadow:var(--shadow);overflow:visible;max-width:900px;margin:0 auto;}
        .sb-segment{flex:1;position:relative;display:flex;flex-direction:column;justify-content:center;padding:0.7rem 1rem;border-right:1.5px solid var(--line);cursor:pointer;transition:background 0.18s;min-width:0;}
        .sb-segment:last-child{border-right:none;}
        .sb-segment:hover{background:rgba(26,43,76,0.025);}
        .sb-segment.active{background:rgba(230,126,34,0.06);}
        .sb-label{font-size:0.67rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);margin-bottom:0.18rem;}
        .sb-value{font-size:0.9rem;font-weight:500;color:var(--indigo);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .sb-placeholder{color:var(--muted);font-weight:400;}
        .sb-input{border:none;outline:none;font-size:0.9rem;font-family:var(--font-inter),'Inter',sans-serif;font-weight:500;color:var(--indigo);background:transparent;width:100%;padding:0;}
        .sb-input::placeholder{color:var(--muted);font-weight:400;}
        .sb-search-btn{
          flex-shrink:0;display:flex;align-items:center;gap:0.5rem;
          padding:0 1.1rem;margin:0.4rem;border-radius:12px;
          background:var(--cacao);color:white;border:none;
          font-size:0.88rem;font-weight:700;font-family:var(--font-inter),'Inter',sans-serif;
          cursor:pointer;transition:all 0.2s;white-space:nowrap;
        }
        .sb-search-btn:hover{background:var(--cacao-dark);transform:translateY(-1px);}
        .sb-search-btn svg{width:16px;height:16px;flex-shrink:0;}
        @media(max-width:720px){
          .search-bar{flex-direction:column;border-radius:20px;}
          .sb-segment{border-right:none;border-bottom:1.5px solid var(--line);}
          .sb-segment:last-of-type{border-bottom:none;}
          .sb-search-btn{margin:0.5rem;border-radius:12px;padding:0.8rem;justify-content:center;}
        }

        /* AUTOCOMPLETE */
        .suggest-dropdown{
          position:absolute;top:calc(100% + 8px);left:0;right:0;
          background:white;border:1.5px solid var(--line);border-radius:16px;
          box-shadow:var(--shadow-lg);z-index:200;overflow:hidden;min-width:220px;
        }
        .suggest-item{
          display:flex;align-items:center;gap:0.75rem;
          padding:0.75rem 1rem;font-size:0.88rem;color:var(--indigo);
          cursor:pointer;transition:background 0.15s;
        }
        .suggest-item:hover{background:rgba(26,43,76,0.04);}
        .suggest-icon{color:var(--muted);flex-shrink:0;font-size:0.9rem;}
        .suggest-region{font-size:0.74rem;color:var(--muted);margin-left:auto;padding-left:0.5rem;white-space:nowrap;}

        /* DATE PICKER */
        .datepicker-panel{
          position:absolute;top:calc(100% + 8px);left:50%;transform:translateX(-50%);
          background:white;border:1.5px solid var(--line);border-radius:20px;
          box-shadow:var(--shadow-lg);z-index:200;padding:1.25rem;
          min-width:min(660px, 96vw);
        }
        @media(max-width:600px){
          .datepicker-panel{left:0;transform:none;min-width:calc(100vw - 2rem);}
        }
        .datepicker-modes{display:flex;gap:0.5rem;margin-bottom:1.25rem;background:rgba(26,43,76,0.05);border-radius:999px;padding:0.3rem;}
        .datepicker-mode-btn{
          flex:1;padding:0.5rem;border-radius:999px;
          font-size:0.83rem;font-weight:600;font-family:var(--font-inter),'Inter',sans-serif;
          border:none;background:transparent;color:var(--muted);cursor:pointer;transition:all 0.2s;
        }
        .datepicker-mode-btn.active{background:white;color:var(--indigo);box-shadow:0 2px 8px rgba(0,0,0,0.09);}
        .cal-nav{display:flex;align-items:center;margin-bottom:0.75rem;}
        .cal-nav-spacer{flex:1;}
        .cal-nav-btn{
          width:32px;height:32px;border-radius:50%;border:1.5px solid var(--line);
          background:white;color:var(--indigo);font-size:1.1rem;cursor:pointer;
          display:flex;align-items:center;justify-content:center;transition:all 0.18s;
        }
        .cal-nav-btn:hover{background:var(--indigo);color:white;border-color:var(--indigo);}
        .cal-two-months{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;}
        @media(max-width:560px){.cal-two-months{grid-template-columns:1fr;}}
        .cal-month-name{font-size:0.9rem;font-weight:700;color:var(--indigo);margin-bottom:0.75rem;text-align:center;}
        .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;}
        .cal-day-name{font-size:0.68rem;font-weight:600;color:var(--muted);text-align:center;padding:0.25rem 0;}
        .cal-day{
          aspect-ratio:1;border-radius:50%;border:none;background:transparent;
          font-size:0.82rem;font-weight:500;color:var(--indigo);cursor:pointer;
          display:flex;align-items:center;justify-content:center;transition:all 0.15s;
          position:relative;
        }
        .cal-day:hover:not(.disabled){background:rgba(26,43,76,0.07);}
        .cal-day.disabled{color:rgba(26,43,76,0.2);cursor:default;}
        .cal-day.start,.cal-day.end{background:var(--indigo) !important;color:white !important;font-weight:700;}
        .cal-day.in-range{background:rgba(26,43,76,0.08);border-radius:0;}
        .cal-day.range-left{border-radius:50% 0 0 50%;}
        .cal-day.range-right{border-radius:0 50% 50% 0;}
        .cal-day.hover-end{background:rgba(26,43,76,0.05);border-radius:50%;}
        .datepicker-footer{display:flex;align-items:center;justify-content:space-between;margin-top:1rem;padding-top:1rem;border-top:1px solid var(--line);}
        .datepicker-summary{font-size:0.84rem;color:var(--muted);}
        .datepicker-clear{font-size:0.82rem;font-weight:600;color:var(--indigo);background:none;border:none;cursor:pointer;text-decoration:underline;font-family:var(--font-inter),'Inter',sans-serif;}

        /* PAYMENT DROPDOWN */
        .payment-dropdown{
          position:absolute;top:calc(100% + 8px);right:0;
          background:white;border:1.5px solid var(--line);border-radius:16px;
          box-shadow:var(--shadow-lg);z-index:200;overflow:hidden;min-width:220px;
        }
        .payment-opt{
          display:flex;align-items:center;justify-content:space-between;
          padding:0.8rem 1.1rem;font-size:0.88rem;font-weight:500;color:var(--indigo);
          cursor:pointer;transition:background 0.15s;gap:0.75rem;
        }
        .payment-opt:hover{background:rgba(26,43,76,0.04);}
        .payment-opt.selected{color:var(--cacao);font-weight:700;}
        .payment-check{color:var(--cacao);font-size:1rem;}

        /* LAYOUT */
        .page-layout{display:flex;height:calc(100dvh - 57px - 73px);position:sticky;top:0;}
        .results-col{
          width:54%;min-width:340px;overflow-y:auto;
          padding:1.25rem 1.5rem 4rem;
          scrollbar-width:thin;scrollbar-color:rgba(26,43,76,0.2) transparent;
        }
        .map-col{
          flex:1;position:sticky;top:0;
          padding:0.75rem;
          background:var(--sand);
        }
        .map-inner{width:100%;height:100%;border-radius:20px;overflow:hidden;box-shadow:var(--shadow);}
        @media(max-width:900px){
          .page-layout{height:auto;flex-direction:column;}
          .results-col{width:100%;overflow-y:visible;padding:1rem 1rem 6rem;}
          .map-col{display:none;height:70vw;max-height:500px;position:static;}
          .map-col.show-mobile{display:block;}
          .results-col.hide-mobile{display:none;}
        }

        /* MOBILE TAB BAR */
        .mobile-tabs{
          display:none;
          position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);
          background:var(--indigo);border-radius:999px;
          padding:0.4rem;gap:0.25rem;
          box-shadow:0 8px 32px rgba(26,43,76,0.35);
          z-index:50;
        }
        .mobile-tab-btn{
          padding:0.6rem 1.25rem;border-radius:999px;font-size:0.84rem;font-weight:600;
          font-family:var(--font-inter),'Inter',sans-serif;border:none;cursor:pointer;transition:all 0.2s;
          display:flex;align-items:center;gap:0.4rem;color:rgba(255,255,255,0.6);background:transparent;
        }
        .mobile-tab-btn.active{background:white;color:var(--indigo);}
        @media(max-width:900px){.mobile-tabs{display:flex;}}

        /* RESULTS HEADER */
        .results-header{margin-bottom:1rem;}
        .results-count{font-size:0.85rem;color:var(--muted);margin-bottom:0.75rem;}
        .results-count strong{color:var(--indigo);font-weight:700;}
        .sort-row{display:flex;align-items:center;gap:0.4rem;flex-wrap:wrap;}
        .sort-label{font-size:0.75rem;color:var(--muted);font-weight:500;}
        .sort-chip{
          padding:0.35rem 0.8rem;border-radius:999px;font-size:0.78rem;font-weight:600;
          font-family:var(--font-inter),'Inter',sans-serif;border:1.5px solid var(--line);background:white;
          color:var(--muted);cursor:pointer;transition:all 0.18s;
        }
        .sort-chip.active{background:var(--indigo);color:white;border-color:var(--indigo);}
        .sort-chip:hover:not(.active){border-color:rgba(26,43,76,0.25);color:var(--indigo);}

        /* PRICE FILTER */
        .price-filter{background:white;border:1.5px solid var(--line);border-radius:14px;padding:1rem 1.1rem;margin-bottom:1rem;}
        .price-filter-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:0.6rem;}
        .price-filter-label{font-size:0.74rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);}
        .price-filter-val{font-size:0.95rem;font-weight:800;color:var(--indigo);}
        .price-filter-val span{font-size:0.72rem;font-weight:400;color:var(--muted);}
        .price-slider-wrap{position:relative;}
        .price-slider-track{
          position:absolute;top:50%;transform:translateY(-50%);
          left:0;height:3px;border-radius:3px;pointer-events:none;
          background:linear-gradient(to right,var(--cacao) ${sliderPct}%,rgba(26,43,76,0.12) ${sliderPct}%);
          width:100%;
        }
        .price-slider{
          width:100%;appearance:none;-webkit-appearance:none;
          background:transparent;height:20px;cursor:pointer;position:relative;z-index:1;
        }
        .price-slider::-webkit-slider-thumb{
          -webkit-appearance:none;width:18px;height:18px;border-radius:50%;
          background:var(--cacao);border:3px solid white;box-shadow:0 2px 8px rgba(230,126,34,0.35);cursor:pointer;
        }
        .price-slider::-moz-range-thumb{
          width:18px;height:18px;border-radius:50%;
          background:var(--cacao);border:3px solid white;box-shadow:0 2px 8px rgba(230,126,34,0.35);cursor:pointer;
        }
        .price-labels{display:flex;justify-content:space-between;font-size:0.68rem;color:var(--muted);margin-top:0.1rem;}

        /* PROXIMITY BANNER */
        .prox-banner{
          display:flex;align-items:flex-start;gap:0.75rem;
          background:rgba(230,126,34,0.07);border:1.5px solid rgba(230,126,34,0.2);
          border-radius:14px;padding:0.9rem 1.1rem;margin-bottom:1.1rem;
        }
        .prox-banner-icon{font-size:1.25rem;flex-shrink:0;margin-top:0.1rem;}
        .prox-banner-text p{font-size:0.88rem;font-weight:600;color:var(--indigo);margin-bottom:0.2rem;}
        .prox-banner-text span{font-size:0.8rem;color:var(--muted);}

        /* CARDS */
        .cards-list{display:flex;flex-direction:column;gap:1rem;}
        .result-card{
          background:white;border:1.5px solid var(--line);border-radius:20px;
          overflow:hidden;text-decoration:none;color:inherit;display:flex;
          box-shadow:var(--shadow);transition:all 0.28s ease;
        }
        .result-card:hover,.result-card.hovered{
          box-shadow:var(--shadow-lg);transform:translateY(-2px);
          border-color:rgba(230,126,34,0.3);
        }
        .result-card-img{
          width:160px;flex-shrink:0;position:relative;overflow:hidden;
        }
        .result-card-img img{
          width:100%;height:100%;object-fit:cover;transition:transform 0.5s ease;
          display:block;
        }
        .result-card:hover .result-card-img img{transform:scale(1.06);}
        .card-tipo-badge{
          position:absolute;top:0.6rem;left:0.6rem;
          background:rgba(26,43,76,0.75);color:white;
          font-size:0.62rem;font-weight:700;letter-spacing:0.05em;
          padding:0.25rem 0.6rem;border-radius:999px;backdrop-filter:blur(4px);
        }
        .result-card-body{flex:1;padding:1rem 1.1rem;display:flex;flex-direction:column;min-width:0;}
        .card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;margin-bottom:0.3rem;}
        .card-name{font-family:var(--font-playfair),'Playfair Display',Georgia,serif;font-size:1.05rem;font-weight:700;color:var(--indigo);line-height:1.3;}
        .card-price-pill{
          flex-shrink:0;background:var(--indigo);color:white;
          font-size:0.82rem;font-weight:800;border-radius:10px;
          padding:0.3rem 0.65rem;white-space:nowrap;
        }
        .card-rating-row{display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;}
        .card-stars{font-size:0.8rem;color:#F59E0B;letter-spacing:0.03em;}
        .card-rating-num{font-size:0.82rem;font-weight:700;color:var(--indigo);}
        .card-reviews{font-size:0.75rem;color:var(--muted);}
        .card-tags{display:flex;gap:0.3rem;flex-wrap:wrap;margin-bottom:0.5rem;}
        .tag{font-size:0.68rem;padding:0.2rem 0.5rem;border-radius:999px;border:1px solid var(--line);color:var(--muted);}
        .card-footer{display:flex;align-items:center;justify-content:space-between;margin-top:auto;}
        .card-dist{font-size:0.75rem;color:var(--muted);display:flex;align-items:center;gap:0.3rem;}
        .card-dist-icon{color:var(--cacao);}
        .card-cta{font-size:0.8rem;font-weight:700;color:var(--cacao);}
        .card-payment{font-size:0.7rem;color:var(--muted);display:flex;gap:0.3rem;flex-wrap:wrap;margin-top:0.4rem;}
        .payment-tag{background:rgba(26,43,76,0.05);padding:0.15rem 0.45rem;border-radius:6px;}
        @media(max-width:560px){
          .result-card{flex-direction:column;}
          .result-card-img{width:100%;height:160px;}
          .result-card-body{padding:0.85rem;}
        }

        /* EMPTY */
        .empty-state{text-align:center;padding:4rem 1.5rem;}
        .empty-state p{font-size:1.1rem;font-weight:700;color:var(--indigo);margin-bottom:0.4rem;}
        .empty-state span{font-size:0.88rem;color:var(--muted);}

        /* Grain overlay */
        .grain{position:fixed;inset:0;pointer-events:none;z-index:200;opacity:0.016;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
      `}</style>

      <div className="grain" />

      {/* NAV */}
      <nav className="nav">
        <Link href="/" className="logo">RESER<span>-VE</span></Link>
        <div className="nav-links">
          <Link href="/buscar" className="nav-link">Destinos</Link>
          <Link href="/registro-posada" className="nav-link">Posaderos</Link>
          <Link href="/#como-funciona" className="nav-link">Cómo funciona</Link>
          <Link href="/registro-posada" className="nav-cta">Registra tu posada</Link>
        </div>
      </nav>

      {/* SEARCH BAR */}
      <div className="search-bar-wrap">
        <div className="search-bar">

          {/* Location */}
          <div className="sb-segment" style={{ flex: '1.6' }}>
            <div className="sb-label">Destino</div>
            <input
              ref={inputRef}
              className="sb-input"
              placeholder="¿A dónde vas?"
              value={query}
              onChange={e => { setQuery(e.target.value); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggest-dropdown" ref={suggestRef}>
                {suggestions.map(s => {
                  const loc = venezuelaLocations.find(l => l.nombre === s)
                  return (
                    <div
                      key={s}
                      className="suggest-item"
                      onMouseDown={() => { setQuery(s); setShowSuggestions(false) }}
                    >
                      <span className="suggest-icon">📍</span>
                      <span>{s}</span>
                      {loc && <span className="suggest-region">{loc.region}</span>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Dates */}
          <div
            className={`sb-segment ${showDatePicker ? 'active' : ''}`}
            style={{ flex: '1.4', cursor: 'pointer' }}
            ref={dateRef}
            onClick={() => { setShowDatePicker(v => !v); setShowPayment(false) }}
          >
            <div className="sb-label">Fechas</div>
            <div className={`sb-value ${!checkIn && !flexible ? 'sb-placeholder' : ''}`}>
              {dateLabel}
            </div>
            {showDatePicker && (
              <DatePickerPanel
                checkIn={checkIn} checkOut={checkOut} flexible={flexible}
                onCheckIn={setCheckIn} onCheckOut={setCheckOut}
                onFlexible={setFlexible}
                onClose={() => setShowDatePicker(false)}
              />
            )}
          </div>

          {/* Payment */}
          <div
            className={`sb-segment ${showPayment ? 'active' : ''}`}
            ref={paymentRef}
            onClick={() => { setShowPayment(v => !v); setShowDatePicker(false) }}
          >
            <div className="sb-label">Pago</div>
            <div className={`sb-value ${!metodoPago ? 'sb-placeholder' : ''}`}>
              {metodoPago || 'Cualquier opción'}
            </div>
            {showPayment && (
              <div className="payment-dropdown">
                {PAYMENT_OPTIONS.map(opt => (
                  <div
                    key={opt.value}
                    className={`payment-opt ${metodoPago === opt.value ? 'selected' : ''}`}
                    onMouseDown={() => { setMetodoPago(opt.value); setShowPayment(false) }}
                  >
                    {opt.label}
                    {metodoPago === opt.value && <span className="payment-check">✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search Button */}
          <button className="sb-search-btn" onClick={() => { setShowSuggestions(false); setShowDatePicker(false); setShowPayment(false) }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Buscar
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="page-layout">

        {/* RESULTS */}
        <div className={`results-col ${mobileTab === 'mapa' ? 'hide-mobile' : ''}`}>

          {/* Price filter */}
          <div className="price-filter">
            <div className="price-filter-row">
              <span className="price-filter-label">Precio máximo / noche</span>
              <span className="price-filter-val">${precioMax} <span>USD</span></span>
            </div>
            <div className="price-slider-wrap">
              <div className="price-slider-track" />
              <input
                type="range" className="price-slider"
                min={40} max={200} step={5} value={precioMax}
                onChange={e => setPrecioMax(Number(e.target.value))}
              />
            </div>
            <div className="price-labels"><span>$40</span><span>$200+</span></div>
          </div>

          {/* Results header */}
          <div className="results-header">
            <p className="results-count">
              <strong>{results.length}</strong> posada{results.length !== 1 ? 's' : ''} encontrada{results.length !== 1 ? 's' : ''}
              {query && resolvedLoc && ` cerca de ${resolvedLoc.location.nombre}`}
            </p>
            <div className="sort-row">
              <span className="sort-label">Ordenar:</span>
              {[
                { v: 'rating', l: 'Valoración' },
                { v: 'precio', l: 'Precio' },
                ...(results.some(r => r.distanceKm !== null) ? [{ v: 'distancia', l: 'Distancia' }] : []),
              ].map(({ v, l }) => (
                <button
                  key={v}
                  className={`sort-chip ${sort === v ? 'active' : ''}`}
                  onClick={() => setSort(v as any)}
                >{l}</button>
              ))}
            </div>
          </div>

          {/* Proximity banner */}
          {isProximity && query && (
            <div className="prox-banner">
              <div className="prox-banner-icon">🧭</div>
              <div className="prox-banner-text">
                <p>No hay posadas en "{query}"</p>
                <span>
                  Mostrando las posadas más cercanas
                  {resolvedLoc ? ` a ${resolvedLoc.location.nombre}` : ''}
                  {' '}— ¡Venezuela siempre tiene algo especial!
                </span>
              </div>
            </div>
          )}

          {/* Cards */}
          {results.length === 0 ? (
            <div className="empty-state">
              <p>Sin resultados</p>
              <span>Prueba con otro destino o ajusta los filtros</span>
            </div>
          ) : (
            <div className="cards-list">
              {results.map(({ posada: p, distanceKm, isProximity: isProx }) => (
                <Link
                  href={`/posadas/${p.slug}`}
                  className={`result-card ${hoveredSlug === p.slug ? 'hovered' : ''}`}
                  key={p.slug}
                  onMouseEnter={() => setHoveredSlug(p.slug)}
                  onMouseLeave={() => setHoveredSlug(null)}
                >
                  <div className="result-card-img">
                    <img src={p.imgs[0]} alt={p.nombre} loading="lazy" />
                    <div className="card-tipo-badge">{p.tipo}</div>
                  </div>
                  <div className="result-card-body">
                    <div className="card-top">
                      <div className="card-name">{p.nombre}</div>
                      <div className="card-price-pill">${p.precio}<span style={{ fontWeight: 400, fontSize: '0.7rem' }}>/noche</span></div>
                    </div>
                    <div className="card-rating-row">
                      <span className="card-stars">{'★'.repeat(Math.round(p.rating))}</span>
                      <span className="card-rating-num">{p.rating}</span>
                      <span className="card-reviews">({p.reviews} reseñas)</span>
                    </div>
                    <div className="card-tags">
                      {p.tags.map(t => <span className="tag" key={t}>{t}</span>)}
                    </div>
                    <div className="card-payment">
                      {p.metodoPago.map(m => <span className="payment-tag" key={m}>{m}</span>)}
                    </div>
                    <div className="card-footer">
                      <div className="card-dist">
                        {distanceKm !== null ? (
                          <>
                            <span className="card-dist-icon">📍</span>
                            {distanceKm < 10
                              ? `${Math.round(distanceKm * 10) / 10} km`
                              : `${Math.round(distanceKm)} km`}
                            {isProx && ' (zona cercana)'}
                          </>
                        ) : (
                          <span>{p.destino}</span>
                        )}
                      </div>
                      <span className="card-cta">Ver posada →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* MAP */}
        <div className={`map-col ${mobileTab === 'mapa' ? 'show-mobile' : ''}`}>
          <div className="map-inner">
            <MapView
              results={results}
              hoveredSlug={hoveredSlug}
              onHover={setHoveredSlug}
              onSelect={slug => router.push(`/posadas/${slug}`)}
            />
          </div>
        </div>
      </div>

      {/* MOBILE TOGGLE */}
      <div className="mobile-tabs">
        <button
          className={`mobile-tab-btn ${mobileTab === 'lista' ? 'active' : ''}`}
          onClick={() => setMobileTab('lista')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="4" width="18" height="2.5" rx="1"/><rect x="3" y="10.75" width="18" height="2.5" rx="1"/><rect x="3" y="17.5" width="18" height="2.5" rx="1"/></svg>
          Lista
        </button>
        <button
          className={`mobile-tab-btn ${mobileTab === 'mapa' ? 'active' : ''}`}
          onClick={() => setMobileTab('mapa')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
          Mapa
        </button>
      </div>
    </>
  )
}

export default function Buscar() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100dvh', background: '#FDFBF7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif', color: '#1A2B4C', fontSize: '0.9rem' }}>
        Cargando…
      </div>
    }>
      <BuscarContent />
    </Suspense>
  )
}
