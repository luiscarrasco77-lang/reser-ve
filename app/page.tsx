'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { venezuelaLocations } from '@/lib/locations-ve'
import { normalizeStr } from '@/lib/search'

function useCounter(target: number, active: boolean, duration = 1800) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [active, target, duration])
  return count
}

export default function Home() {
  const [scrollY, setScrollY] = useState(0)
  const [progress, setProgress] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState<'viajero' | 'posadero'>('viajero')
  const [destinoBusqueda, setDestinoBusqueda] = useState('')
  // Search bar state
  type SbSug = { label: string; sub: string; lat?: number; lng?: number; isStatic: boolean }
  const [sbSuggestions, setSbSuggestions] = useState<SbSug[]>([])
  const [sbShowSug, setSbShowSug] = useState(false)
  const [sbSugLoading, setSbSugLoading] = useState(false)
  const [sbOverrideLat, setSbOverrideLat] = useState<number | undefined>()
  const [sbOverrideLng, setSbOverrideLng] = useState<number | undefined>()
  const [sbOverrideName, setSbOverrideName] = useState<string | undefined>()
  const [sbCheckIn, setSbCheckIn] = useState<Date | null>(null)
  const [sbCheckOut, setSbCheckOut] = useState<Date | null>(null)
  const [sbFlexible, setSbFlexible] = useState(false)
  const [sbFlexType, setSbFlexType] = useState<'meses'|'semanas'>('meses')
  const [sbFlexMonths, setSbFlexMonths] = useState<string[]>([])
  const [sbFlexWeeks, setSbFlexWeeks] = useState(0)
  const [sbShowDate, setSbShowDate] = useState(false)
  const [sbShowPay, setSbShowPay] = useState(false)
  const [sbPago, setSbPago] = useState('')
  const [sbHover, setSbHover] = useState<Date | null>(null)
  const [sbDateStep, setSbDateStep] = useState<'in'|'out'>('in')
  const [sbViewMonth, setSbViewMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const sbSugRef = useRef<HTMLDivElement>(null)
  const sbDateRef = useRef<HTMLDivElement>(null)
  const sbPayRef = useRef<HTMLDivElement>(null)
  const sbInputRef = useRef<HTMLInputElement>(null)
  const sbNomTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [statsVisible, setStatsVisible] = useState(false)
  const [slideIdx, setSlideIdx] = useState(0)
  const [slideKey, setSlideKey] = useState(0)
  const statsRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const heroSlides = [
    '/images/CayoDeAgua.webp',
    '/images/Jape.webp',
    '/images/KerepaKupaiWenaII.webp',
    '/images/CayoSombero.webp',
    '/images/RapidosDeMayupa.webp',
    '/images/Medanos.webp',
    '/images/Guacamaya.webp',
  ]

  const c1 = useCounter(49, statsVisible)
  const c2 = useCounter(44, statsVisible)
  const c3 = useCounter(6, statsVisible)

  const handleCardTilt = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12
    el.style.transform = `perspective(900px) rotateX(${y}deg) rotateY(${x}deg) translateY(-8px) scale(1.02)`
  }, [])

  const handleCardReset = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = ''
  }, [])

  useEffect(() => {
    // Preload next 2 slides immediately, then stagger the rest to avoid blocking
    heroSlides.slice(1, 3).forEach(src => {
      const img = new window.Image(); img.src = src
    })
    let preloadIdx = 3
    const preloadTimer = setInterval(() => {
      if (preloadIdx < heroSlides.length) {
        const img = new window.Image(); img.src = heroSlides[preloadIdx++]
      } else {
        clearInterval(preloadTimer)
      }
    }, 2000)

    const interval = setInterval(() => {
      setSlideIdx(prev => (prev + 1) % heroSlides.length)
      setSlideKey(k => k + 1)
    }, 7000)
    return () => { clearInterval(interval); clearInterval(preloadTimer) }
  }, [])

  useEffect(() => {
    setLoaded(true)
    const onScroll = () => {
      const sy = window.scrollY
      setScrollY(sy)
      const total = document.documentElement.scrollHeight - window.innerHeight
      setProgress(total > 0 ? (sy / total) * 100 : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    const revealObs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => revealObs.observe(el))

    const statsObs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) setStatsVisible(true) }),
      { threshold: 0.5 }
    )
    if (statsRef.current) statsObs.observe(statsRef.current)

    return () => {
      window.removeEventListener('scroll', onScroll)
      revealObs.disconnect()
      statsObs.disconnect()
    }
  }, [])

  // ── Search bar helpers ────────────────────────────────────────────
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (sbSugRef.current && !sbSugRef.current.contains(e.target as Node) && e.target !== sbInputRef.current) setSbShowSug(false)
      if (sbDateRef.current && !sbDateRef.current.contains(e.target as Node)) setSbShowDate(false)
      if (sbPayRef.current && !sbPayRef.current.contains(e.target as Node)) setSbShowPay(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchSbSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) { setSbSuggestions([]); return }
    setSbSugLoading(true)
    const ql = q.toLowerCase()
    const staticMatches = venezuelaLocations
      .filter(l => [l.nombre, ...l.aliases].some(a => a.toLowerCase().includes(ql)))
      .slice(0, 4)
      .map(l => ({ label: l.nombre, sub: l.region, lat: l.lat, lng: l.lng, isStatic: true }))
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      const nomMatches = data.slice(0, 8).map((r: any) => {
        const addr = r.address
        const sub = [addr?.state, addr?.municipality || addr?.city || addr?.town || addr?.village]
          .filter(Boolean).join(', ') || 'Venezuela'
        return { label: r.display_name.split(',')[0].trim(), sub, lat: parseFloat(r.lat), lng: parseFloat(r.lon), isStatic: false }
      }).filter((n: any) => !staticMatches.some(s => s.label.toLowerCase() === n.label.toLowerCase()))
      setSbSuggestions([...staticMatches, ...nomMatches].slice(0, 8))
    } catch {
      setSbSuggestions(staticMatches)
    }
    setSbSugLoading(false)
  }, [])

  useEffect(() => {
    if (sbNomTimer.current) clearTimeout(sbNomTimer.current)
    if (!destinoBusqueda.trim()) { setSbSuggestions([]); return }
    sbNomTimer.current = setTimeout(() => fetchSbSuggestions(destinoBusqueda), 350)
    return () => { if (sbNomTimer.current) clearTimeout(sbNomTimer.current) }
  }, [destinoBusqueda, fetchSbSuggestions])

  function sbHandleDay(date: Date) {
    const today = new Date(); today.setHours(0,0,0,0)
    if (date < today) return
    if (sbDateStep === 'in' || !sbCheckIn || date <= sbCheckIn) {
      setSbCheckIn(date); setSbCheckOut(null); setSbDateStep('out')
    } else {
      setSbCheckOut(date); setSbDateStep('in')
      setTimeout(() => setSbShowDate(false), 280)
    }
  }

  function sbFmtDate(d: Date | null) {
    if (!d) return ''
    return d.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })
  }

  const MONTHS_SHORT_LBL = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const sbDateLabel = sbFlexible
    ? sbFlexMonths.length > 0
      ? sbFlexMonths.slice(0,2).map(m => {
          const [y, mo] = m.split('-').map(Number)
          const today = new Date()
          return MONTHS_SHORT_LBL[mo-1] + (today.getFullYear() !== y ? ` ${y}` : '')
        }).join(', ') + (sbFlexMonths.length > 2 ? '…' : '')
      : sbFlexWeeks > 0
        ? `${sbFlexWeeks} semana${sbFlexWeeks > 1 ? 's' : ''}`
        : 'Fechas flexibles'
    : sbCheckIn && sbCheckOut
      ? `${sbFmtDate(sbCheckIn)} – ${sbFmtDate(sbCheckOut)}`
      : sbCheckIn ? `${sbFmtDate(sbCheckIn)} – Salida` : 'Fechas'

  const sbNights = sbCheckIn && sbCheckOut
    ? Math.round((sbCheckOut.getTime() - sbCheckIn.getTime()) / 86400000) : 0

  function sbAddMonths(d: Date, n: number) { const r = new Date(d); r.setMonth(r.getMonth() + n); return r }

  function sbIsSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  }

  const MONTH_NAMES_SB = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const today0 = new Date(); today0.setHours(0,0,0,0)
  const sbNext = sbAddMonths(sbViewMonth, 1)

  function renderSbMonth(year: number, month: number) {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startOffset = firstDay.getDay()
    const cells: (Date | null)[] = []
    for (let i = 0; i < startOffset; i++) cells.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d))
    const endRange = sbCheckOut || sbHover
    return (
      <div className="sb-cal-month" key={`${year}-${month}`}>
        <div className="sb-cal-mname">{MONTH_NAMES_SB[month]} {year}</div>
        <div className="sb-cal-grid">
          {['Do','Lu','Ma','Mi','Ju','Vi','Sá'].map(d => <div key={d} className="sb-cal-dname">{d}</div>)}
          {cells.map((date, i) => {
            if (!date) return <div key={`e${i}`} />
            const isPast = date < today0
            const isStart = sbCheckIn && sbIsSameDay(date, sbCheckIn)
            const isEnd = sbCheckOut && sbIsSameDay(date, sbCheckOut)
            const inRange = sbCheckIn && endRange && date > sbCheckIn && date < endRange
            const isHovEnd = sbHover && !sbCheckOut && sbIsSameDay(date, sbHover)
            let cls = 'sb-cal-day'
            if (isPast) cls += ' disabled'
            if (isStart) cls += ' start'
            if (isEnd) cls += ' end'
            if (inRange) cls += ' in-range'
            if (isHovEnd && !isEnd) cls += ' hover-end'
            if (isStart && sbCheckOut) cls += ' range-left'
            if (isEnd && !isStart) cls += ' range-right'
            return (
              <button key={date.toISOString()} className={cls} disabled={!!isPast}
                onClick={() => sbHandleDay(date)}
                onMouseEnter={() => { if (sbCheckIn && !sbCheckOut) setSbHover(date) }}
                onMouseLeave={() => setSbHover(null)}>
                {date.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  function sbHandleSearch() {
    const params = new URLSearchParams()
    if (destinoBusqueda) params.set('q', destinoBusqueda)
    if (sbOverrideLat !== undefined) params.set('overrideLat', String(sbOverrideLat))
    if (sbOverrideLng !== undefined) params.set('overrideLng', String(sbOverrideLng))
    if (sbOverrideName)              params.set('overrideName', sbOverrideName)
    if (sbFlexible) {
      params.set('flexible', '1')
      if (sbFlexMonths.length > 0) params.set('flexMonths', sbFlexMonths.join(','))
      if (sbFlexWeeks > 0)         params.set('flexWeeks',  String(sbFlexWeeks))
    } else {
      if (sbCheckIn)  params.set('checkIn',  sbCheckIn.toISOString().split('T')[0])
      if (sbCheckOut) params.set('checkOut', sbCheckOut.toISOString().split('T')[0])
    }
    if (sbPago) params.set('pago', sbPago)
    router.push(`/buscar?${params.toString()}`)
  }

  const destinos: { name: string; slug: string | null; tag: string; count: string; img: string; wide?: boolean }[] = [
    { name: 'Los Roques', slug: 'los-roques', tag: 'Archipiélago', count: '12 posadas', img: '/images/Archipielago.webp' },
    { name: 'Mérida', slug: 'merida', tag: 'Los Andes', count: '9 posadas', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=90' },
    { name: 'Mochima', slug: 'mochima', tag: 'Costa Oriental', count: '7 posadas', img: '/images/Mochima.webp' },
    { name: 'Morrocoy', slug: 'morrocoy', tag: 'Costa Occidental', count: '6 posadas', img: '/images/CayoSombero.webp' },
    { name: 'Canaima', slug: 'canaima', tag: 'Gran Sabana', count: '4 posadas', img: '/images/KerepaKupaiWena.webp' },
    { name: 'Isla Margarita', slug: 'isla-margarita', tag: 'Caribe', count: '11 posadas', img: '/images/PlayaElAgua.webp' },
    { name: 'Otros destinos', slug: null, tag: 'Descúbrelos', count: 'Vargas, Miranda y más', img: '/images/PlayaElIndio.webp', wide: true },
  ]

  return (
    <>
      <style>{`
        /* fonts loaded via next/font in layout.tsx */

        :root {
          --indigo: #1A2B4C;
          --indigo-deep: #0F1B30;
          --sand: #FDFBF7;
          --cream: #F5EFE0;
          --cacao: #E67E22;
          --cacao-dark: #C96510;
          --cacao-light: rgba(230,126,34,0.12);
          --text: #1A2B4C;
          --muted: #7A8699;
          --line: rgba(26,43,76,0.08);
          --shadow: 0 8px 32px rgba(26,43,76,0.10);
          --shadow-lg: 0 20px 60px rgba(26,43,76,0.14);
        }

        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        html { scroll-behavior:smooth; }
        body {
          font-family:'Inter',sans-serif;
          background: linear-gradient(180deg,#fffefb 0%,var(--sand) 60%,#f5ede0 100%);
          color:var(--text); overflow-x:hidden;
        }

        /* SCROLL PROGRESS */
        .scroll-bar {
          position:fixed; top:0; left:0; height:3px; z-index:300;
          background:linear-gradient(90deg, var(--cacao), var(--cacao-dark));
          border-radius:0 3px 3px 0;
          transition:width 0.08s linear;
          pointer-events:none;
        }

        /* GRAIN TEXTURE */
        .grain {
          position:fixed; inset:0; pointer-events:none; z-index:100; opacity:0.016;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        /* ─── REVEAL ANIMATIONS ─── */
        .reveal {
          opacity:0; transform:translateY(52px);
          transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1);
        }
        .reveal-left {
          opacity:0; transform:translateX(-52px);
          transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1);
        }
        .reveal-right {
          opacity:0; transform:translateX(52px);
          transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1);
        }
        .reveal-scale {
          opacity:0; transform:scale(0.92);
          transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1);
        }
        .reveal.visible, .reveal-left.visible, .reveal-right.visible, .reveal-scale.visible {
          opacity:1; transform:none;
        }
        .d1 { transition-delay:0.1s !important; }
        .d2 { transition-delay:0.2s !important; }
        .d3 { transition-delay:0.3s !important; }
        .d4 { transition-delay:0.4s !important; }
        .d5 { transition-delay:0.5s !important; }
        .d6 { transition-delay:0.6s !important; }

        /* ─── KEYFRAMES ─── */
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes wordIn { from{opacity:0;transform:translateY(32px) rotateX(-12deg)} to{opacity:1;transform:translateY(0) rotateX(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes pulseShadow {
          0%,100%{box-shadow:0 12px 30px rgba(230,126,34,0.28)}
          50%{box-shadow:0 12px 44px rgba(230,126,34,0.48),0 0 0 10px rgba(230,126,34,0.06)}
        }
        @keyframes slideInRight { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
        @keyframes kenBurns { from{transform:scale(1)} to{transform:scale(1.08)} }
        @keyframes lineGrow { from{transform:scaleX(0)} to{transform:scaleX(1)} }

        .anim-0 { animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .anim-1 { animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.15s both; }
        .anim-2 { animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.28s both; }
        .anim-3 { animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.42s both; }
        .anim-4 { animation:fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.56s both; }

        /* ─── NAV ─── */
        .nav {
          position:fixed; top:0; left:0; right:0; z-index:60;
          display:flex; align-items:center; justify-content:space-between;
          padding:1rem 2rem; transition:all 0.38s ease;
        }
        .nav.scrolled {
          background:rgba(253,251,247,0.92); backdrop-filter:blur(24px);
          border-bottom:1px solid var(--line);
          box-shadow:0 8px 40px rgba(26,43,76,0.07);
          padding:0.75rem 2rem;
        }
        .logo-img { height:34px; width:auto; display:block; transition:opacity 0.2s; }
        .logo-img:hover { opacity:0.82; }
        .nav-links { display:flex; align-items:center; gap:1.5rem; }
        .nav-link {
          font-size:0.9rem; color:rgba(255,255,255,0.88); text-decoration:none;
          font-weight:500; transition:color 0.22s; position:relative;
        }
        .nav.scrolled .nav-link { color:rgba(26,43,76,0.72); }
        .nav-link::after {
          content:''; position:absolute; bottom:-3px; left:0; right:0;
          height:1.5px; background:var(--cacao); transform:scaleX(0);
          transform-origin:left; transition:transform 0.28s ease;
        }
        .nav-link:hover::after { transform:scaleX(1); }
        .nav-link:hover { color:white; }
        .nav.scrolled .nav-link:hover { color:var(--indigo); }
        .nav-cta {
          padding:0.72rem 1.2rem; border-radius:999px;
          font-size:0.84rem; font-weight:700; cursor:pointer;
          background:var(--cacao); border:none; color:white;
          box-shadow:0 10px 28px rgba(230,126,34,0.28); transition:all 0.22s;
          font-family:'Inter',sans-serif; text-decoration:none;
          animation:pulseShadow 3s ease-in-out infinite;
        }
        .nav-cta:hover { background:var(--cacao-dark); transform:translateY(-1px); animation:none; box-shadow:0 14px 35px rgba(230,126,34,0.38); }
        @media(max-width:768px){.nav-links{display:none;} .nav{padding:1rem;} .nav.scrolled{padding:0.75rem 1rem;}}

        /* ─── HERO ─── */
        .hero {
          min-height:100dvh; position:relative;
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          overflow:visible; padding:7rem 1.5rem 3rem;
        }
        /* ─── HERO SLIDESHOW ─── */
        .hero-slideshow { position:absolute; inset:0; overflow:hidden; }
        .hero-slide {
          position:absolute; inset:0;
          background-size:cover; background-position:center;
          opacity:0;
          transition:opacity 1.8s cubic-bezier(0.16,1,0.3,1);
          filter:saturate(1.12) brightness(0.76);
          will-change:opacity, transform;
        }
        .hero-slide.active {
          opacity:1;
          animation:kenBurns 10s ease-in-out forwards;
        }

        /* ─── SLIDE DOTS ─── */
        .slide-dots {
          display:flex; gap:0.5rem; align-items:center; margin-top:1.6rem;
        }
        .slide-dot {
          height:5px; width:5px; border-radius:99px; border:none; cursor:pointer; padding:0;
          background:rgba(255,255,255,0.42);
          transition:all 0.45s cubic-bezier(0.16,1,0.3,1);
        }
        .slide-dot:hover { background:rgba(255,255,255,0.72); }
        .slide-dot.active { width:24px; background:white; box-shadow:0 2px 12px rgba(0,0,0,0.28); }
        .hero-overlay {
          position:absolute; inset:0;
          background:linear-gradient(105deg,rgba(15,27,48,0.85) 0%,rgba(26,43,76,0.6) 40%,rgba(26,43,76,0.15) 70%,transparent 100%);
        }
        .hero-overlay2 {
          position:absolute; inset:0;
          background:linear-gradient(180deg,transparent 50%,rgba(15,27,48,0.45) 100%);
        }
        .hero-content {
          position:relative; z-index:2;
          width:100%; max-width:1100px; margin:0 auto; color:white;
        }
        .hero-panel { max-width:640px; padding:1rem 0; }
        .hero-badges { display:flex; gap:0.65rem; flex-wrap:wrap; margin-bottom:1.2rem; }
        .hero-badge {
          display:inline-flex; align-items:center;
          padding:0.48rem 1rem; font-size:0.75rem; font-weight:700;
          border-radius:999px; background:rgba(230,126,34,0.95); color:white;
          box-shadow:0 8px 22px rgba(230,126,34,0.22);
          animation:float 3.5s ease-in-out infinite;
        }
        .hero-badge:nth-child(2) { animation-delay:0.5s; background:rgba(255,255,255,0.18); backdrop-filter:blur(8px); }
        .hero-h1 {
          font-family:'Playfair Display',Georgia,serif;
          font-size:clamp(3rem,8vw,6rem); line-height:0.92;
          letter-spacing:-0.04em; font-weight:800; margin-bottom:1.2rem;
        }
        .hero-h1 em { font-style:italic; color:#ffc88a; }
        .hero-word {
          display:inline-block; opacity:0; transform:translateY(36px) rotateX(-14deg);
          animation:wordIn 0.75s cubic-bezier(0.16,1,0.3,1) forwards;
          transform-origin:bottom center;
        }
        .hero-sub {
          max-width:520px; font-size:1.05rem; line-height:1.8;
          color:rgba(255,255,255,0.82); margin-bottom:2rem;
        }
        .hero-btns { display:flex; gap:1rem; flex-wrap:wrap; }
        .btn-primary {
          display:inline-flex; align-items:center; gap:0.5rem;
          text-decoration:none; padding:1.05rem 1.8rem; border-radius:999px;
          font-size:0.95rem; font-weight:700; cursor:pointer;
          background:var(--cacao); border:none; color:white;
          box-shadow:0 12px 32px rgba(230,126,34,0.32); transition:all 0.25s;
          font-family:'Inter',sans-serif;
        }
        .btn-primary:hover { background:var(--cacao-dark); transform:translateY(-2px); box-shadow:0 18px 42px rgba(230,126,34,0.42); }
        .btn-primary:active { transform:scale(0.97); }
        .btn-secondary {
          display:inline-flex; align-items:center; gap:0.5rem;
          text-decoration:none; padding:1.05rem 1.8rem; border-radius:999px;
          font-size:0.95rem; font-weight:600; cursor:pointer;
          background:transparent; color:white;
          border:1.5px solid rgba(255,255,255,0.45);
          backdrop-filter:blur(10px); transition:all 0.25s;
          font-family:'Inter',sans-serif;
        }
        .btn-secondary:hover { background:rgba(255,255,255,0.14); border-color:rgba(255,255,255,0.75); transform:translateY(-2px); }

        /* ─── SEARCH BAR (Airbnb-style) ─── */
        .search-wrap { position:relative; z-index:500; width:100%; max-width:880px; margin:2rem auto 0; }
        .sb-bar {
          display:flex; align-items:stretch;
          background:rgba(255,255,255,0.97); border:1px solid rgba(255,255,255,0.7);
          backdrop-filter:blur(28px); border-radius:20px; padding:0.5rem;
          box-shadow:0 28px 80px rgba(15,27,48,0.30),0 0 0 1px rgba(255,255,255,0.5);
          gap:0;
        }
        .sb-seg {
          flex:1; position:relative; display:flex; flex-direction:column;
          justify-content:center; padding:0.7rem 1rem; border-right:1.5px solid rgba(26,43,76,0.09);
          cursor:pointer; transition:background 0.18s; border-radius:12px; min-width:0;
        }
        .sb-seg:last-of-type { border-right:none; }
        .sb-seg:hover { background:rgba(26,43,76,0.03); }
        .sb-seg.open { background:rgba(230,126,34,0.07); }
        .sb-seg-lbl { font-size:0.62rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:rgba(26,43,76,0.5); margin-bottom:0.18rem; }
        .sb-seg-val { font-size:0.88rem; font-weight:500; color:#1A2B4C; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .sb-seg-val.ph { color:rgba(26,43,76,0.4); font-weight:400; }
        .sb-input { border:none; outline:none; font-size:0.88rem; font-family:inherit; font-weight:500; color:#1A2B4C; background:transparent; width:100%; padding:0; }
        .sb-input::placeholder { color:rgba(26,43,76,0.4); font-weight:400; }
        .sb-go {
          flex-shrink:0; display:flex; align-items:center; gap:0.45rem;
          padding:0 1.2rem; margin:0.3rem 0.3rem 0.3rem 0.5rem; border-radius:14px;
          background:var(--cacao); color:white; border:none;
          font-size:0.88rem; font-weight:700; font-family:inherit;
          cursor:pointer; transition:all 0.2s; white-space:nowrap;
          box-shadow:0 6px 20px rgba(230,126,34,0.3); min-height:44px;
        }
        .sb-go:hover { background:var(--cacao-dark); transform:translateY(-1px); }
        /* Dropdowns */
        .sb-suggest, .sb-date-panel, .sb-pay-panel {
          position:absolute; top:calc(100% + 10px); left:0;
          background:white; border:1.5px solid rgba(26,43,76,0.09);
          border-radius:18px; box-shadow:0 16px 52px rgba(26,43,76,0.16);
          z-index:600; overflow:visible;
        }
        .sb-suggest { min-width:240px; }
        .sb-sug-item { display:flex; align-items:center; gap:0.7rem; padding:0.8rem 1rem; font-size:0.88rem; color:#1A2B4C; cursor:pointer; transition:background 0.14s; }
        .sb-sug-item:hover { background:rgba(26,43,76,0.04); }
        .sb-sug-reg { font-size:0.72rem; color:rgba(26,43,76,0.45); margin-left:auto; padding-left:0.4rem; white-space:nowrap; }
        /* Date panel */
        .sb-date-panel { padding:1.1rem; min-width:min(640px,92vw); left:50%; transform:translateX(-50%); }
        .sb-date-modes { display:flex; gap:0.4rem; background:rgba(26,43,76,0.05); border-radius:999px; padding:0.28rem; margin-bottom:1rem; }
        .sb-mode-btn { flex:1; padding:0.45rem; border-radius:999px; font-size:0.82rem; font-weight:600; font-family:inherit; border:none; background:transparent; color:rgba(26,43,76,0.5); cursor:pointer; transition:all 0.18s; }
        .sb-mode-btn.on { background:white; color:#1A2B4C; box-shadow:0 2px 8px rgba(0,0,0,0.08); }
        .sb-cal-nav { display:flex; margin-bottom:0.7rem; }
        .sb-cal-nav-spacer { flex:1; }
        .sb-cal-nav-btn { width:30px; height:30px; border-radius:50%; border:1.5px solid rgba(26,43,76,0.12); background:white; color:#1A2B4C; font-size:1rem; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.18s; }
        .sb-cal-nav-btn:hover { background:#1A2B4C; color:white; border-color:#1A2B4C; }
        .sb-cal-months { display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; }
        @media(max-width:560px){ .sb-cal-months{grid-template-columns:1fr;} }
        .sb-cal-month { }
        .sb-cal-mname { font-size:0.87rem; font-weight:700; color:#1A2B4C; text-align:center; margin-bottom:0.65rem; }
        .sb-cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; }
        .sb-cal-dname { font-size:0.65rem; font-weight:600; color:rgba(26,43,76,0.4); text-align:center; padding:0.2rem 0; }
        .sb-cal-day { aspect-ratio:1; border-radius:50%; border:none; background:transparent; font-size:0.8rem; font-weight:500; color:#1A2B4C; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.14s; }
        .sb-cal-day:hover:not(.disabled) { background:rgba(26,43,76,0.07); }
        .sb-cal-day.disabled { color:rgba(26,43,76,0.2); cursor:default; }
        .sb-cal-day.start,.sb-cal-day.end { background:#1A2B4C !important; color:white !important; font-weight:700; }
        .sb-cal-day.in-range { background:rgba(26,43,76,0.08); border-radius:0; }
        .sb-cal-day.range-left { border-radius:50% 0 0 50%; }
        .sb-cal-day.range-right { border-radius:0 50% 50% 0; }
        .sb-cal-day.hover-end { background:rgba(26,43,76,0.05); border-radius:50%; }
        .sb-date-footer { display:flex; align-items:center; justify-content:space-between; margin-top:0.9rem; padding-top:0.9rem; border-top:1px solid rgba(26,43,76,0.08); }
        .sb-date-summary { font-size:0.82rem; color:rgba(26,43,76,0.55); }
        .sb-date-clear { font-size:0.8rem; font-weight:600; color:#1A2B4C; background:none; border:none; cursor:pointer; font-family:inherit; text-decoration:underline; }
        /* Payment panel */
        .sb-pay-panel { min-width:210px; right:0; left:auto; }
        .sb-pay-opt { display:flex; align-items:center; justify-content:space-between; padding:0.8rem 1.1rem; font-size:0.87rem; font-weight:500; color:#1A2B4C; cursor:pointer; transition:background 0.14s; gap:0.5rem; }
        .sb-pay-opt:hover { background:rgba(26,43,76,0.04); }
        .sb-pay-opt.sel { color:var(--cacao); font-weight:700; }
        .sb-pay-check { color:var(--cacao); }
        /* Flexible picker */
        .sb-flex-tabs{display:flex;gap:0.35rem;background:rgba(26,43,76,0.05);border-radius:999px;padding:0.25rem;margin-bottom:0.9rem;}
        .sb-flex-tab{flex:1;padding:0.43rem;border-radius:999px;font-size:0.8rem;font-weight:600;font-family:inherit;border:none;background:transparent;color:rgba(26,43,76,0.5);cursor:pointer;transition:all 0.17s;}
        .sb-flex-tab.on{background:white;color:#1A2B4C;box-shadow:0 2px 7px rgba(0,0,0,0.08);}
        .sb-flex-hint{font-size:0.79rem;color:rgba(26,43,76,0.5);margin-bottom:0.75rem;}
        .sb-flex-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:0.48rem;margin-bottom:0.75rem;}
        @media(max-width:480px){.sb-flex-grid{grid-template-columns:repeat(3,1fr);}}
        .sb-flex-month{border:1.5px solid rgba(26,43,76,0.1);border-radius:12px;padding:0.6rem 0.4rem;cursor:pointer;background:white;font-family:inherit;transition:all 0.17s;display:flex;flex-direction:column;align-items:center;gap:0.12rem;}
        .sb-flex-month:hover{border-color:#1A2B4C;}
        .sb-flex-month.on{border-color:#1A2B4C;background:#1A2B4C;}
        .sb-flex-month.on .sb-flex-mname,.sb-flex-month.on .sb-flex-myear{color:white;}
        .sb-flex-mname{font-size:0.85rem;font-weight:700;color:#1A2B4C;}
        .sb-flex-myear{font-size:0.67rem;color:rgba(26,43,76,0.4);}
        .sb-flex-weeks{display:flex;gap:0.45rem;flex-wrap:wrap;}
        .sb-flex-chip{padding:0.48rem 1rem;border-radius:999px;border:1.5px solid rgba(26,43,76,0.1);background:white;font-size:0.81rem;font-weight:600;font-family:inherit;color:rgba(26,43,76,0.5);cursor:pointer;transition:all 0.17s;}
        .sb-flex-chip:hover{border-color:#1A2B4C;color:#1A2B4C;}
        .sb-flex-chip.on{background:#1A2B4C;color:white;border-color:#1A2B4C;}
        @media(max-width:780px){
          .sb-bar { flex-direction:column; border-radius:22px; }
          .sb-seg { border-right:none; border-bottom:1.5px solid rgba(26,43,76,0.08); border-radius:0; }
          .sb-seg:last-of-type { border-bottom:none; }
          .sb-go { margin:0.4rem; border-radius:14px; padding:0.85rem; justify-content:center; }
          .sb-date-panel { left:0; transform:none; min-width:calc(100vw - 2.5rem); }
        }

        /* ─── PHOTO MOSAIC ─── */
        .mosaic-section { padding:0; overflow:hidden; }
        .mosaic-grid {
          display:grid;
          grid-template-columns:1.4fr 1fr 1fr;
          grid-template-rows:420px;
          gap:4px;
        }
        @media(max-width:768px){
          .mosaic-grid{grid-template-columns:1fr 1fr;grid-template-rows:240px 240px;}
          .mosaic-item:last-child{grid-column:1/3;}
        }
        @media(max-width:480px){ .mosaic-grid{grid-template-columns:1fr;grid-template-rows:280px 200px 200px;} .mosaic-item:last-child{grid-column:auto;} }
        .mosaic-item {
          position:relative; overflow:hidden; cursor:pointer;
        }
        .mosaic-item img {
          width:100%; height:100%; object-fit:cover;
          transition:transform 0.8s cubic-bezier(0.16,1,0.3,1), filter 0.5s ease;
          filter:brightness(0.88) saturate(1.1);
        }
        .mosaic-item:hover img { transform:scale(1.07); filter:brightness(0.96) saturate(1.15); }
        .mosaic-label {
          position:absolute; bottom:0; left:0; right:0;
          background:linear-gradient(to top,rgba(15,27,48,0.75) 0%,transparent 100%);
          padding:2rem 1.5rem 1.25rem;
          font-family:'Playfair Display',Georgia,serif;
          font-size:1.25rem; font-weight:700; color:white;
          transform:translateY(4px); transition:transform 0.4s ease;
        }
        .mosaic-item:hover .mosaic-label { transform:translateY(0); }
        .mosaic-tag {
          display:inline-block; font-family:'Inter',sans-serif;
          font-size:0.68rem; font-weight:700; letter-spacing:0.1em;
          color:rgba(255,255,255,0.72); text-transform:uppercase; margin-bottom:0.3rem;
        }

        /* ─── STATS STRIP ─── */
        .stats-strip {
          background:var(--cream);
          border-top:1px solid rgba(230,126,34,0.12);
          border-bottom:1px solid rgba(230,126,34,0.12);
        }
        .stats-inner {
          max-width:1100px; margin:0 auto;
          display:grid; grid-template-columns:repeat(4,1fr);
          padding:0;
        }
        @media(max-width:640px){ .stats-inner{grid-template-columns:repeat(2,1fr);} }
        .stat-item {
          padding:2.5rem 1.5rem; text-align:center;
          border-right:1px solid rgba(26,43,76,0.08);
          transition:background 0.3s;
        }
        .stat-item:last-child { border-right:none; }
        .stat-item:hover { background:rgba(230,126,34,0.04); }
        .stat-n {
          font-family:'Playfair Display',Georgia,serif;
          font-size:2.8rem; font-weight:800; letter-spacing:-0.05em;
          color:var(--indigo); line-height:1; margin-bottom:0.4rem;
        }
        .stat-n .accent { color:var(--cacao); }
        .stat-l { font-size:0.84rem; color:var(--muted); font-weight:500; }

        /* ─── DIVIDER ─── */
        .divider {
          width:min(1100px,calc(100% - 3rem)); height:1px; margin:0 auto;
          background:linear-gradient(to right,transparent,rgba(26,43,76,0.1),transparent);
          transform-origin:center; animation:lineGrow 1.2s cubic-bezier(0.16,1,0.3,1) both;
        }

        /* ─── SECTIONS ─── */
        .section { padding:7rem 1.5rem; max-width:1100px; margin:0 auto; }
        .section-label {
          display:inline-flex; align-items:center; gap:0.5rem;
          padding:0.44rem 0.85rem; border-radius:999px; font-size:0.74rem; font-weight:700;
          color:var(--cacao); background:rgba(230,126,34,0.08); border:1px solid rgba(230,126,34,0.18);
          margin-bottom:1.1rem;
        }
        .section-label::before { content:''; width:6px; height:6px; border-radius:50%; background:var(--cacao); }
        .section-h2 {
          font-family:'Playfair Display',Georgia,serif;
          font-size:clamp(2.2rem,5vw,3.8rem); line-height:1.0;
          letter-spacing:-0.04em; font-weight:800; color:var(--indigo); margin-bottom:0.9rem;
        }
        .section-h2 em { font-style:italic; color:var(--cacao); }
        .section-sub { font-size:1.05rem; line-height:1.82; color:var(--muted); max-width:680px; margin-bottom:2.8rem; }

        /* ─── SPLIT SECTION (posada explanation) ─── */
        .split-section { display:grid; grid-template-columns:1fr 1fr; gap:5rem; align-items:center; }
        @media(max-width:768px){ .split-section{grid-template-columns:1fr; gap:3rem;} }
        .split-photo {
          position:relative; border-radius:28px; overflow:hidden;
          aspect-ratio:4/5;
          box-shadow:0 30px 80px rgba(26,43,76,0.18);
        }
        .split-photo img { width:100%; height:100%; object-fit:cover; transition:transform 0.6s ease; }
        .split-photo:hover img { transform:scale(1.04); }
        .split-photo-badge {
          position:absolute; bottom:1.5rem; left:1.5rem; right:1.5rem;
          background:rgba(253,251,247,0.96); backdrop-filter:blur(16px);
          border-radius:16px; padding:1.1rem 1.25rem;
          border:1px solid rgba(26,43,76,0.08);
          box-shadow:0 8px 32px rgba(26,43,76,0.12);
        }
        .split-photo-badge-title { font-size:0.82rem; font-weight:700; color:var(--indigo); margin-bottom:0.2rem; }
        .split-photo-badge-sub { font-size:0.75rem; color:var(--muted); }
        .split-text .blockquote {
          font-family:'Playfair Display',Georgia,serif;
          font-size:1.4rem; font-style:italic; color:var(--indigo);
          line-height:1.6; margin-bottom:1.5rem;
          padding-left:1.5rem; border-left:3px solid var(--cacao);
        }
        .feature-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-top:2rem; }
        @media(max-width:480px){ .feature-grid{grid-template-columns:1fr;} }
        .feature-card {
          padding:1.1rem 1.2rem; background:white;
          border:1px solid var(--line); border-radius:16px;
          box-shadow:0 4px 16px rgba(26,43,76,0.06);
          transition:transform 0.25s, box-shadow 0.25s;
        }
        .feature-card:hover { transform:translateY(-3px); box-shadow:var(--shadow); }
        .feature-card-icon { font-size:1.3rem; margin-bottom:0.5rem; }
        .feature-card-title { font-size:0.88rem; font-weight:700; color:var(--indigo); margin-bottom:0.2rem; }
        .feature-card-desc { font-size:0.78rem; color:var(--muted); line-height:1.5; }

        /* ─── TABS ─── */
        .tabs {
          display:inline-flex; padding:0.3rem; border-radius:999px;
          background:rgba(26,43,76,0.05); border:1px solid rgba(26,43,76,0.09);
          margin-bottom:2.5rem; gap:0.3rem;
        }
        .tab-btn {
          padding:0.85rem 1.4rem; border:none; border-radius:999px;
          background:transparent; color:rgba(26,43,76,0.58);
          font-size:0.9rem; font-weight:600; cursor:pointer;
          transition:all 0.25s; font-family:'Inter',sans-serif; min-height:44px;
        }
        .tab-btn.active { background:var(--indigo); color:white; box-shadow:0 10px 24px rgba(26,43,76,0.2); }
        .tab-btn:hover:not(.active) { color:var(--indigo); background:rgba(26,43,76,0.06); }

        /* ─── STEPS ─── */
        .steps-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:1.25rem; }
        .step-card {
          padding:1.75rem; border-radius:24px;
          background:rgba(255,255,255,0.88);
          border:1px solid var(--line);
          box-shadow:var(--shadow); transition:all 0.3s ease; cursor:default;
        }
        .step-card:hover { transform:translateY(-5px); box-shadow:var(--shadow-lg); border-color:rgba(230,126,34,0.2); }
        .step-card-recommended {
          position:relative; padding:1.75rem; border-radius:24px;
          background:linear-gradient(135deg,rgba(230,126,34,0.07) 0%,rgba(230,126,34,0.02) 100%);
          border:1.5px dashed rgba(230,126,34,0.38);
          box-shadow:0 8px 30px rgba(230,126,34,0.12); transition:all 0.3s ease; cursor:default;
        }
        .step-card-recommended:hover { transform:translateY(-5px); box-shadow:0 20px 50px rgba(230,126,34,0.18); }
        .step-badge {
          position:absolute; top:-12px; left:1.5rem;
          padding:0.24rem 0.85rem; border-radius:999px;
          background:var(--cacao); color:white;
          font-size:0.62rem; font-weight:800; letter-spacing:0.12em; text-transform:uppercase;
          box-shadow:0 4px 14px rgba(230,126,34,0.38);
        }
        .step-optional { display:inline-block; margin-top:0.6rem; font-size:0.72rem; font-weight:600; color:rgba(230,126,34,0.72); }
        .step-num { font-family:'Playfair Display',serif; font-size:2.4rem; font-weight:800; color:var(--cacao); margin-bottom:0.8rem; letter-spacing:-0.05em; }
        .step-title { font-size:1rem; font-weight:700; color:var(--indigo); margin-bottom:0.55rem; }
        .step-desc { font-size:0.9rem; line-height:1.72; color:var(--muted); }

        /* ─── DESTINATIONS ─── */
        .dest-grid {
          display:grid;
          grid-template-columns:repeat(3,1fr);
          grid-template-rows:auto auto;
          gap:1.25rem;
        }
        @media(max-width:900px){ .dest-grid{grid-template-columns:repeat(2,1fr);} }
        @media(max-width:560px){ .dest-grid{grid-template-columns:1fr;} }
        .dest-card {
          position:relative; overflow:hidden; cursor:pointer;
          border-radius:24px; text-decoration:none; color:inherit;
          box-shadow:var(--shadow);
          transition:box-shadow 0.4s ease;
          aspect-ratio:4/3;
          will-change:transform;
        }
        .dest-card.featured { grid-column:1/3; aspect-ratio:16/8; }
        @media(max-width:900px){ .dest-card.featured{grid-column:1/3;aspect-ratio:16/9;} }
        @media(max-width:560px){ .dest-card.featured{grid-column:1;aspect-ratio:4/3;} }
        /* Wide card (Otros destinos) — full row on tablet/mobile to avoid implicit grid columns */
        .dest-card-wide { grid-column:2/4; }
        @media(max-width:900px){ .dest-card-wide{grid-column:1/3;} }
        @media(max-width:560px){ .dest-card-wide{grid-column:1;} }
        .dest-card:hover { box-shadow:0 28px 60px rgba(26,43,76,0.22); }
        .dest-card img { width:100%; height:100%; object-fit:cover; transition:transform 0.7s cubic-bezier(0.16,1,0.3,1); filter:brightness(0.82) saturate(1.1); display:block; }
        .dest-card:hover img { transform:scale(1.07); }
        .dest-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(15,27,48,0.88) 0%,rgba(15,27,48,0.12) 65%); transition:background 0.4s; }
        .dest-card:hover .dest-overlay { background:linear-gradient(to top,rgba(15,27,48,0.72) 0%,rgba(15,27,48,0.05) 65%); }
        .dest-info { position:absolute; left:0; right:0; bottom:0; padding:1.5rem; }
        .dest-tag {
          display:inline-block; margin-bottom:0.6rem;
          padding:0.36rem 0.7rem; border-radius:999px;
          font-size:0.7rem; font-weight:700; color:white;
          background:rgba(230,126,34,0.94);
          white-space:nowrap; max-width:100%; overflow:hidden; text-overflow:ellipsis;
        }
        .dest-name {
          font-family:'Playfair Display',Georgia,serif;
          font-size:1.5rem; font-weight:800; color:white; margin-bottom:0.25rem;
          line-height:1.15;
        }
        .dest-card.featured .dest-name { font-size:2.2rem; }
        .dest-count { font-size:0.85rem; color:rgba(255,255,255,0.82); }
        .dest-arrow {
          position:absolute; top:1.25rem; right:1.25rem; width:36px; height:36px;
          border-radius:50%; background:rgba(255,255,255,0.18); backdrop-filter:blur(8px);
          display:flex; align-items:center; justify-content:center;
          font-size:1rem; color:white; opacity:0;
          transition:opacity 0.3s, transform 0.3s; transform:translateX(-8px);
        }
        .dest-card:hover .dest-arrow { opacity:1; transform:translateX(0); }

        /* ─── TESTIMONIALS ─── */
        .testimonials-section { background:var(--cream); padding:7rem 1.5rem; }
        .testimonials-inner { max-width:1100px; margin:0 auto; }
        .testimonials-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1.5rem; }
        @media(max-width:900px){ .testimonials-grid{grid-template-columns:1fr 1fr;} }
        @media(max-width:580px){ .testimonials-grid{grid-template-columns:1fr;} }
        .testimonial-card {
          background:white; border-radius:24px;
          padding:2rem; border:1px solid var(--line);
          box-shadow:var(--shadow); position:relative; overflow:hidden;
          transition:transform 0.3s, box-shadow 0.3s;
        }
        .testimonial-card:hover { transform:translateY(-5px); box-shadow:var(--shadow-lg); }
        .testimonial-bar { height:4px; background:var(--cacao); border-radius:4px 4px 0 0; position:absolute; top:0; left:0; right:0; }
        .testimonial-stars { color:var(--cacao); font-size:0.95rem; margin-bottom:1rem; letter-spacing:2px; }
        .testimonial-quote {
          font-family:'Playfair Display',Georgia,serif;
          font-size:1.05rem; font-style:italic; line-height:1.75;
          color:var(--indigo); margin-bottom:1.5rem;
        }
        .testimonial-author { display:flex; align-items:center; gap:0.75rem; }
        .testimonial-avatar {
          width:40px; height:40px; border-radius:50%;
          background:linear-gradient(135deg,var(--cacao),var(--cacao-dark));
          display:flex; align-items:center; justify-content:center;
          font-size:0.95rem; font-weight:800; color:white; flex-shrink:0;
          font-family:'Playfair Display',serif;
        }
        .testimonial-name { font-size:0.88rem; font-weight:700; color:var(--indigo); }
        .testimonial-from { font-size:0.76rem; color:var(--muted); }

        /* ─── POSADEROS ─── */
        .posadero-section {
          background:rgba(255,255,255,0.85); border:1px solid var(--line);
          padding:3rem; border-radius:32px;
          display:flex; gap:3rem; align-items:flex-start; flex-wrap:wrap;
          box-shadow:var(--shadow);
        }
        .posadero-left { flex:1.2; min-width:280px; }
        .posadero-right { flex:1; min-width:270px; }
        .feature-list { display:flex; flex-direction:column; gap:1rem; margin-top:1.5rem; }
        .feature-item { display:flex; align-items:flex-start; gap:0.85rem; padding:0.75rem 0; border-bottom:1px solid rgba(26,43,76,0.04); }
        .feature-item:last-child { border-bottom:none; }
        .feature-dot { width:10px; height:10px; border-radius:50%; background:var(--cacao); margin-top:0.38rem; flex-shrink:0; box-shadow:0 2px 8px rgba(230,126,34,0.3); }
        .feature-text { font-size:0.94rem; line-height:1.7; color:var(--muted); }

        /* ─── PLAN CARD ─── */
        .plan-card {
          padding:2rem; border-radius:24px;
          background:linear-gradient(180deg,#fffaf3 0%,white 100%);
          border:1px solid rgba(230,126,34,0.2);
          box-shadow:0 24px 60px rgba(230,126,34,0.12);
        }
        .plan-label {
          display:inline-block; margin-bottom:1rem;
          padding:0.35rem 0.7rem; border-radius:999px;
          font-size:0.74rem; font-weight:700; color:var(--cacao-dark);
          background:rgba(230,126,34,0.1); border:1px solid rgba(230,126,34,0.15);
        }
        .plan-price {
          font-family:'Playfair Display',serif;
          font-size:2.8rem; font-weight:800; line-height:1;
          letter-spacing:-0.05em; color:var(--indigo); margin-bottom:0.3rem;
        }
        .plan-price span { font-family:'Inter',sans-serif; font-size:0.88rem; font-weight:500; color:var(--muted); }
        .plan-desc { font-size:0.92rem; line-height:1.7; color:var(--muted); margin:0.9rem 0 1.3rem; }
        .plan-items { list-style:none; display:flex; flex-direction:column; gap:0.75rem; margin-bottom:1.5rem; }
        .plan-items li { font-size:0.92rem; color:var(--text); display:flex; gap:0.65rem; align-items:flex-start; }
        .plan-items li::before { content:'✓'; color:var(--cacao); font-weight:800; flex-shrink:0; font-size:0.9rem; margin-top:0.05rem; }
        .full-btn { width:100%; text-align:center; cursor:pointer; }

        /* ─── DARK CTA BAND ─── */
        .dark-cta {
          background:var(--indigo-deep);
          padding:7rem 1.5rem;
          text-align:center;
          position:relative; overflow:hidden;
        }
        .dark-cta-bg-img {
          position:absolute; inset:0;
          background:url('/images/MedinaEnCenitalII.webp') center/cover no-repeat;
          filter:blur(5px) brightness(0.42) saturate(0.75);
          transform:scale(1.03);
          pointer-events:none; z-index:0;
        }
        .dark-cta-glow {
          position:absolute; inset:0; z-index:1; pointer-events:none;
          background:
            radial-gradient(ellipse 80% 55% at 50% 50%, rgba(230,126,34,0.18) 0%, transparent 70%),
            linear-gradient(180deg, rgba(15,27,48,0.55) 0%, rgba(15,27,48,0.3) 50%, rgba(15,27,48,0.7) 100%);
        }
        .dark-cta-inner { position:relative; z-index:2; max-width:680px; margin:0 auto; }
        .dark-cta h2 {
          font-family:'Playfair Display',Georgia,serif;
          font-size:clamp(2.4rem,6vw,4rem); font-weight:800;
          color:white; letter-spacing:-0.04em; line-height:1.05; margin-bottom:1rem;
        }
        .dark-cta h2 em { font-style:italic; color:#ffc88a; }
        .dark-cta p { font-size:1.05rem; line-height:1.8; color:rgba(255,255,255,0.68); margin-bottom:2.5rem; }
        .dark-cta-btns { display:flex; gap:1rem; justify-content:center; flex-wrap:wrap; }
        .btn-light {
          display:inline-flex; align-items:center; gap:0.5rem;
          text-decoration:none; padding:1.1rem 2rem; border-radius:999px;
          font-size:0.95rem; font-weight:700; cursor:pointer;
          background:white; color:var(--indigo); transition:all 0.25s;
          font-family:'Inter',sans-serif;
          box-shadow:0 12px 36px rgba(0,0,0,0.2);
        }
        .btn-light:hover { transform:translateY(-2px); box-shadow:0 18px 48px rgba(0,0,0,0.28); }
        .btn-outline-light {
          display:inline-flex; align-items:center; gap:0.5rem;
          text-decoration:none; padding:1.1rem 2rem; border-radius:999px;
          font-size:0.95rem; font-weight:600; cursor:pointer;
          background:transparent; color:rgba(255,255,255,0.9);
          border:1.5px solid rgba(255,255,255,0.35); transition:all 0.25s;
          font-family:'Inter',sans-serif;
        }
        .btn-outline-light:hover { background:rgba(255,255,255,0.1); border-color:rgba(255,255,255,0.7); transform:translateY(-2px); }

        /* ─── FOOTER ─── */
        .footer {
          background:var(--indigo);
          padding:5rem 1.5rem 2rem;
          color:rgba(255,255,255,0.72);
        }
        .footer-grid {
          max-width:1100px; margin:0 auto;
          display:grid; grid-template-columns:1.8fr 1fr 1fr 1fr;
          gap:3rem; margin-bottom:4rem;
        }
        @media(max-width:900px){ .footer-grid{grid-template-columns:1fr 1fr; gap:2rem;} }
        @media(max-width:560px){ .footer-grid{grid-template-columns:1fr; gap:2rem;} }
        .footer-brand .logo-img-footer { height:28px; filter:brightness(0) invert(1); margin-bottom:1.1rem; }
        .footer-brand p { font-size:0.9rem; line-height:1.7; color:rgba(255,255,255,0.55); max-width:260px; }
        .footer-col h4 { font-size:0.76rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.45); margin-bottom:1.2rem; }
        .footer-col a { display:block; font-size:0.9rem; color:rgba(255,255,255,0.65); text-decoration:none; margin-bottom:0.65rem; transition:color 0.2s; }
        .footer-col a:hover { color:white; }
        .footer-bottom {
          max-width:1100px; margin:0 auto;
          border-top:1px solid rgba(255,255,255,0.08);
          padding-top:2rem;
          display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem;
        }
        .footer-bottom p { font-size:0.82rem; color:rgba(255,255,255,0.38); }
        .footer-bottom a { color:rgba(255,255,255,0.45); text-decoration:none; font-size:0.82rem; transition:color 0.2s; }
        .footer-bottom a:hover { color:rgba(255,255,255,0.8); }

        @media(max-width:768px){
          .section{padding:5rem 1rem;}
          .posadero-section{padding:2rem;gap:2rem;}
          .dark-cta{padding:5rem 1rem;}
          .footer{padding:4rem 1rem 2rem;}
        }
        @media(max-width:480px){
          .hero-h1{font-size:2.8rem;}
          .hero-sub{font-size:0.95rem;}
          .hero{padding:6rem 1rem 2.5rem;}
          .dest-card.featured .dest-name{font-size:1.6rem;}
        }

        @media(prefers-reduced-motion:reduce){
          .reveal, .reveal-left, .reveal-right, .reveal-scale { transition:none; }
          .hero-word { animation:none; opacity:1; transform:none; }
          .hero-badge { animation:none; }
          .nav-cta { animation:none; }
          .hero-bg-img { animation:none; }
        }
      `}</style>

      <div className="scroll-bar" style={{ width: `${progress}%` }} />
      <div className="grain" />

      {/* ── NAV ─────────────────────────────────────────── */}
      <nav className={`nav ${scrollY > 60 ? 'scrolled' : ''}`}>
        <a href="/">
          <img
            src="/images/logo-horizontal.svg"
            alt="RESER-VE"
            className="logo-img"
            style={{ filter: scrollY > 60 ? 'none' : 'brightness(0) invert(1)' }}
          />
        </a>
        <div className="nav-links">
          <a href="/buscar" className="nav-link">Destinos</a>
          <a href="/registro-posada" className="nav-link">Posaderos</a>
          <a href="#como-funciona" className="nav-link">Cómo funciona</a>
          <a href="/registro-posada" className="nav-cta">Registra tu posada</a>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-slideshow">
          {heroSlides.map((src, i) => (
            <div
              key={i === slideIdx ? `active-${slideKey}` : src}
              className={`hero-slide${i === slideIdx ? ' active' : ''}`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
        </div>
        <div className="hero-overlay" />
        <div className="hero-overlay2" />

        <div className="hero-content">
          <div className="hero-panel">
            <div className={`hero-badges ${loaded ? 'anim-0' : ''}`}>
              <span className="hero-badge">Boutique</span>
              <span className="hero-badge">Venezuela</span>
            </div>
            <h1 className={`hero-h1 ${loaded ? 'anim-1' : ''}`}>
              {loaded ? (
                <>
                  {'Descubre'.split('').map((c,i) => (
                    <span key={i} className="hero-word" style={{animationDelay:`${0.15 + i*0.03}s`}}>{c}</span>
                  ))}
                  {' '}
                  <em style={{display:'inline-block', whiteSpace:'nowrap'}}>
                    {'posadas'.split('').map((c,i) => (
                      <span key={i} className="hero-word" style={{animationDelay:`${0.48 + i*0.03}s`}}>{c}</span>
                    ))}
                  </em>
                  <br />
                  {'auténticas'.split('').map((c,i) => (
                    <span key={i} className="hero-word" style={{animationDelay:`${0.88 + i*0.025}s`}}>{c}</span>
                  ))}
                </>
              ) : 'Descubre posadas auténticas'}
            </h1>
            <p className={`hero-sub ${loaded ? 'anim-2' : ''}`}>
              La primera plataforma de alojamientos locales venezolanos. Reserva con confianza, paga en USD o bolívares.
            </p>
            <div className={`hero-btns ${loaded ? 'anim-3' : ''}`}>
              <a href="/buscar" className="btn-primary">Explorar posadas →</a>
              <a href="/registro-posada" className="btn-secondary">¿Tienes una posada?</a>
            </div>
            {/* Slide indicators — inline below buttons, no overlap with search bar */}
            <div className="slide-dots">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  className={`slide-dot${i === slideIdx ? ' active' : ''}`}
                  onClick={() => { setSlideIdx(i); setSlideKey(k => k + 1) }}
                  aria-label={`Foto ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className={`search-wrap ${loaded ? 'anim-4' : ''}`}>
          <div className="sb-bar">

            {/* Location */}
            <div className="sb-seg" style={{ flex: '1.6' }}>
              <div className="sb-seg-lbl">Destino</div>
              <input
                ref={sbInputRef}
                className="sb-input"
                placeholder="¿A dónde vas?"
                value={destinoBusqueda}
                onChange={e => { setDestinoBusqueda(e.target.value); setSbShowSug(true); setSbOverrideLat(undefined); setSbOverrideLng(undefined); setSbOverrideName(undefined) }}
                onFocus={() => setSbShowSug(true)}
                autoComplete="off"
              />
              {sbShowSug && (destinoBusqueda.length > 0) && (
                <div className="sb-suggest" ref={sbSugRef}>
                  {sbSugLoading && sbSuggestions.length === 0 && (
                    <div className="sb-sug-item" style={{color:'rgba(26,43,76,0.45)',fontSize:'0.82rem'}}>
                      Buscando en Venezuela…
                    </div>
                  )}
                  {sbSuggestions.map((s, i) => (
                    <div key={i} className="sb-sug-item"
                      onMouseDown={() => {
                        setDestinoBusqueda(s.label)
                        setSbOverrideLat(s.lat); setSbOverrideLng(s.lng); setSbOverrideName(s.label)
                        setSbShowSug(false)
                      }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="rgba(26,43,76,0.45)" style={{flexShrink:0}}>
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      <span style={{flex:1,minWidth:0}}>
                        <span style={{display:'block',fontWeight:500}}>{s.label}</span>
                        <span style={{fontSize:'0.71rem',color:'rgba(26,43,76,0.45)'}}>{s.sub}</span>
                      </span>
                      {s.isStatic && (
                        <span style={{fontSize:'0.6rem',fontWeight:700,padding:'0.12rem 0.38rem',borderRadius:'999px',background:'rgba(230,126,34,0.1)',color:'#E67E22',flexShrink:0}}>
                          Popular
                        </span>
                      )}
                    </div>
                  ))}
                  {!sbSugLoading && sbSuggestions.length === 0 && destinoBusqueda.length > 1 && (
                    <div className="sb-sug-item" style={{color:'rgba(26,43,76,0.45)',fontSize:'0.82rem'}}>
                      Sin resultados para &quot;{destinoBusqueda}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dates */}
            <div
              className={`sb-seg ${sbShowDate ? 'open' : ''}`}
              style={{ flex: '1.3' }}
              ref={sbDateRef}
              onClick={() => { setSbShowDate(v => !v); setSbShowPay(false) }}
            >
              <div className="sb-seg-lbl">Fechas</div>
              <div className={`sb-seg-val ${!sbCheckIn && !sbFlexible ? 'ph' : ''}`}>{sbDateLabel}</div>

              {sbShowDate && (
                <div className="sb-date-panel" onClick={e => e.stopPropagation()}>
                  <div className="sb-date-modes">
                    <button className={`sb-mode-btn ${!sbFlexible ? 'on' : ''}`} onClick={() => { setSbFlexible(false); setSbFlexMonths([]); setSbFlexWeeks(0) }}>Fechas exactas</button>
                    <button className={`sb-mode-btn ${sbFlexible ? 'on' : ''}`} onClick={() => { setSbFlexible(true); setSbCheckIn(null); setSbCheckOut(null) }}>Fechas flexibles</button>
                  </div>
                  {!sbFlexible ? (
                    <>
                      <div className="sb-cal-nav">
                        <button className="sb-cal-nav-btn" onClick={() => setSbViewMonth(m => sbAddMonths(m, -1))}>‹</button>
                        <div className="sb-cal-nav-spacer" />
                        <button className="sb-cal-nav-btn" onClick={() => setSbViewMonth(m => sbAddMonths(m, 1))}>›</button>
                      </div>
                      <div className="sb-cal-months">
                        {renderSbMonth(sbViewMonth.getFullYear(), sbViewMonth.getMonth())}
                        {renderSbMonth(sbNext.getFullYear(), sbNext.getMonth())}
                      </div>
                      <div className="sb-date-footer">
                        <span className="sb-date-summary">
                          {sbNights > 0 ? `${sbNights} noche${sbNights > 1 ? 's' : ''}: ${sbFmtDate(sbCheckIn)} – ${sbFmtDate(sbCheckOut)}`
                            : sbDateStep === 'in' ? 'Selecciona entrada' : 'Selecciona salida'}
                        </span>
                        <button className="sb-date-clear" onClick={() => { setSbCheckIn(null); setSbCheckOut(null); setSbDateStep('in') }}>Borrar</button>
                      </div>
                    </>
                  ) : (
                    /* Flexible picker — Airbnb style */
                    (() => {
                      const today = new Date()
                      const MONTHS_SHORT_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
                      const upcoming18 = Array.from({length:18},(_,i)=>{
                        const d=new Date(today.getFullYear(),today.getMonth()+i,1)
                        const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
                        return {key,label:MONTHS_SHORT_ES[d.getMonth()],year:d.getFullYear()}
                      })
                      return (
                        <>
                          <div className="sb-flex-tabs">
                            <button className={`sb-flex-tab${sbFlexType==='meses'?' on':''}`} onClick={()=>setSbFlexType('meses')}>Meses</button>
                            <button className={`sb-flex-tab${sbFlexType==='semanas'?' on':''}`} onClick={()=>setSbFlexType('semanas')}>Semanas</button>
                          </div>
                          {sbFlexType==='meses' ? (
                            <>
                              <p className="sb-flex-hint">¿En qué mes quieres viajar?</p>
                              <div className="sb-flex-grid">
                                {upcoming18.map(({key,label,year})=>(
                                  <button key={key}
                                    className={`sb-flex-month${sbFlexMonths.includes(key)?' on':''}`}
                                    onClick={()=>setSbFlexMonths(prev=>prev.includes(key)?prev.filter(m=>m!==key):[...prev,key])}>
                                    <span className="sb-flex-mname">{label}</span>
                                    <span className="sb-flex-myear">{year}</span>
                                  </button>
                                ))}
                              </div>
                              {sbFlexMonths.length>0 && (
                                <button style={{fontSize:'0.76rem',fontWeight:600,color:'rgba(26,43,76,0.55)',background:'none',border:'none',cursor:'pointer',textDecoration:'underline',fontFamily:'inherit'}}
                                  onClick={()=>setSbFlexMonths([])}>Borrar selección</button>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="sb-flex-hint">¿Cuánto tiempo quieres quedarte?</p>
                              <div className="sb-flex-weeks">
                                {([{v:0,l:'Cualquier semana'},{v:1,l:'1 semana'},{v:2,l:'2 semanas'},{v:3,l:'3 semanas'},{v:4,l:'4 semanas'}] as const).map(({v,l})=>(
                                  <button key={v} className={`sb-flex-chip${sbFlexWeeks===v?' on':''}`} onClick={()=>setSbFlexWeeks(v as number)}>{l}</button>
                                ))}
                              </div>
                            </>
                          )}
                        </>
                      )
                    })()
                  )}
                </div>
              )}
            </div>

            {/* Payment */}
            <div
              className={`sb-seg ${sbShowPay ? 'open' : ''}`}
              ref={sbPayRef}
              onClick={() => { setSbShowPay(v => !v); setSbShowDate(false) }}
            >
              <div className="sb-seg-lbl">Pago</div>
              <div className={`sb-seg-val ${!sbPago ? 'ph' : ''}`}>{sbPago || 'Cualquier opción'}</div>
              {sbShowPay && (
                <div className="sb-pay-panel" onClick={e => e.stopPropagation()}>
                  {[
                    { v: '', l: 'Cualquier opción' },
                    { v: 'Zelle', l: 'Zelle' },
                    { v: 'Transferencia', l: 'Transferencia bancaria' },
                    { v: 'Efectivo USD', l: 'Efectivo USD' },
                    { v: 'Efectivo Bs', l: 'Efectivo Bs' },
                    { v: 'Tarjeta', l: 'Tarjeta de crédito' },
                  ].map(({ v, l }) => (
                    <div key={v} className={`sb-pay-opt ${sbPago === v ? 'sel' : ''}`}
                      onMouseDown={() => { setSbPago(v); setSbShowPay(false) }}>
                      {l}
                      {sbPago === v && <span className="sb-pay-check">✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Go */}
            <button className="sb-go" onClick={sbHandleSearch}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Buscar
            </button>
          </div>
        </div>
      </section>

      {/* ── PHOTO MOSAIC ─────────────────────────────────── */}
      <section className="mosaic-section">
        <div className="mosaic-grid">
          <a href="/destinos/los-roques" className="mosaic-item" style={{textDecoration:'none'}}>
            <img
              src="/images/PalafitosEnElCielo.webp"
              alt="Los Roques"
              loading="lazy"
            />
            <div className="mosaic-label">
              <div className="mosaic-tag">Archipiélago</div>
              <div>Los Roques</div>
            </div>
          </a>
          <a href="/buscar" className="mosaic-item" style={{textDecoration:'none'}}>
            <img
              src="/images/Waku-lodge-facilities-.webp"
              alt="Posadas auténticas"
              loading="lazy"
            />
            <div className="mosaic-label">
              <div className="mosaic-tag">Experiencia</div>
              <div>Posadas auténticas</div>
            </div>
          </a>
          <a href="/destinos/canaima" className="mosaic-item" style={{textDecoration:'none'}}>
            <img
              src="/images/UruyenI.webp"
              alt="Canaima"
              loading="lazy"
            />
            <div className="mosaic-label">
              <div className="mosaic-tag">Gran Sabana</div>
              <div>Canaima</div>
            </div>
          </a>
        </div>
      </section>

      {/* ── STATS STRIP ─────────────────────────────────── */}
      <div className="stats-strip" ref={statsRef}>
        <div className="stats-inner">
          <div className="stat-item reveal d1">
            <div className="stat-n"><span className="accent">+{c1}</span></div>
            <div className="stat-l">posadas registradas</div>
          </div>
          <div className="stat-item reveal d2">
            <div className="stat-n"><span className="accent">+{c2}%</span></div>
            <div className="stat-l">crecimiento turístico</div>
          </div>
          <div className="stat-item reveal d3">
            <div className="stat-n">{c3}</div>
            <div className="stat-l">destinos exclusivos</div>
          </div>
          <div className="stat-item reveal d4">
            <div className="stat-n" style={{fontSize:'1.8rem',letterSpacing:'-0.02em'}}>Flexible</div>
            <div className="stat-l">USD, Bs, Zelle, Binance</div>
          </div>
        </div>
      </div>

      <div className="divider" style={{marginTop:'5rem'}} />

      {/* ── QUÉ ES UNA POSADA ────────────────────────────── */}
      <section className="section">
        <div className="split-section">
          <div className="split-photo reveal-left">
            <img
              src="/images/lodge-canaima_01.webp"
              alt="Posada boutique en Venezuela"
              loading="lazy"
            />
            <div className="split-photo-badge">
              <div className="split-photo-badge-title">Posada La Brisa · Los Roques</div>
              <div className="split-photo-badge-sub">★ 4.9 · 48 reseñas · desde $120/noche</div>
            </div>
          </div>
          <div className="split-text reveal-right">
            <div className="section-label">Sobre las posadas</div>
            <h2 className="section-h2">¿Qué es una <em>posada</em>?</h2>
            <p className="blockquote">
              "Calidez, autenticidad y una experiencia que ningún hotel de cadena puede ofrecer."
            </p>
            <p className="section-sub" style={{marginBottom:'0'}}>
              Una posada es un alojamiento íntimo, cálido y genuino — gestionado por familias locales en los destinos más extraordinarios de Venezuela.
            </p>
            <div className="feature-grid">
              {([
                {
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cacao)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
                  title:'Ubicaciones únicas', desc:'Frente al mar, en montaña o en la selva'
                },
                {
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cacao)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                  title:'Trato familiar', desc:'Anfitriones que conocen cada rincón'
                },
                {
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cacao)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
                  title:'Pagos flexibles', desc:'USD, Bs, Zelle, Pago Móvil, Binance'
                },
                {
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cacao)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
                  title:'Verificadas', desc:'Fotos reales, descripciones honestas'
                },
              ] as {icon:React.ReactNode, title:string, desc:string}[]).map((f,i) => (
                <div className={`feature-card reveal d${i+1}`} key={i}>
                  <div className="feature-card-icon" style={{marginBottom:'0.6rem'}}>{f.icon}</div>
                  <div className="feature-card-title">{f.title}</div>
                  <div className="feature-card-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── CÓMO FUNCIONA ────────────────────────────────── */}
      <section id="como-funciona" className="section">
        <div className="reveal">
          <div className="section-label">Cómo funciona</div>
          <h2 className="section-h2">Simple para <em>todos</em></h2>
          <p className="section-sub">Desde la búsqueda hasta el check-in. Una experiencia clara y confiable.</p>
        </div>
        <div className="reveal d1">
          <div className="tabs">
            <button className={`tab-btn ${activeTab === 'viajero' ? 'active' : ''}`} onClick={() => setActiveTab('viajero')}>
              Soy viajero
            </button>
            <button className={`tab-btn ${activeTab === 'posadero' ? 'active' : ''}`} onClick={() => setActiveTab('posadero')}>
              Tengo una posada
            </button>
          </div>
        </div>

        {activeTab === 'viajero' ? (
          <div className="steps-grid">
            {[
              ['Busca tu destino', 'Filtra por destino, fechas y método de pago en los rincones más especiales de Venezuela.'],
              ['Elige con confianza', 'Fotos profesionales, perfiles verificados y toda la información antes de reservar.'],
              ['Reserva y paga fácil', 'Paga en USD o bolívares con Zelle, Pago Móvil, transferencia o Binance.'],
              ['Vive la experiencia', 'Llega con todo listo y disfruta una estancia boutique sin fricción.'],
            ].map(([t, d], i) => (
              <div className={`step-card anim-${i+1}`} key={i}>
                <div className="step-num">0{i + 1}</div>
                <div className="step-title">{t}</div>
                <div className="step-desc">{d}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="steps-grid">
            <div className="step-card anim-1">
              <div className="step-num">01</div>
              <div className="step-title">Registra tu posada</div>
              <div className="step-desc">Alta sencilla y visual para mostrar tu espacio con el nivel que merece.</div>
            </div>
            <div className="step-card-recommended anim-2">
              <div className="step-badge">Recomendado</div>
              <div className="step-num">02</div>
              <div className="step-title">Te ayudamos con el contenido</div>
              <div className="step-desc">Fotografía profesional y acompañamiento para presentar tu posada de forma premium.</div>
              <span className="step-optional">Servicio opcional · consulta nuestros planes</span>
            </div>
            <div className="step-card anim-3">
              <div className="step-num">03</div>
              <div className="step-title">Empieza a recibir reservas</div>
              <div className="step-desc">Tu perfil queda activo para viajeros locales, internacionales y diáspora venezolana.</div>
            </div>
            <div className="step-card anim-4">
              <div className="step-num">04</div>
              <div className="step-title">Cobra con flexibilidad</div>
              <div className="step-desc">Recibe pagos en USD o bolívares con Zelle, Pago Móvil, transferencia o Binance.</div>
            </div>
          </div>
        )}
      </section>

      <div className="divider" />

      {/* ── DESTINOS ─────────────────────────────────────── */}
      <section id="destinos" className="section">
        <div className="reveal">
          <div className="section-label">Destinos</div>
          <h2 className="section-h2">Los rincones más <em>extraordinarios</em></h2>
          <p className="section-sub">Posadas verificadas en los destinos que hacen de Venezuela un país único en el mundo.</p>
        </div>
        <div className="dest-grid">
          {destinos.map((d, i) => (
            <a
              href={d.slug ? `/destinos/${d.slug}` : '/buscar'}
              className={`dest-card reveal ${i === 0 ? 'featured' : ''} ${d.wide ? 'dest-card-wide' : ''} d${Math.min(i+1,6)}`}
              key={i}
              onMouseMove={handleCardTilt}
              onMouseLeave={handleCardReset}
              style={{transition:'transform 0.15s ease, box-shadow 0.4s ease'}}
            >
              <img src={d.img} alt={d.name} loading={i === 0 ? 'eager' : 'lazy'} />
              <div className="dest-overlay" />
              <div className="dest-info">
                <div className="dest-tag">{d.tag}</div>
                <div className="dest-name">{d.name}</div>
                <div className="dest-count">{d.count}</div>
              </div>
              <div className="dest-arrow">→</div>
            </a>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────── */}
      <section className="testimonials-section">
        <div className="testimonials-inner">
          <div className="reveal" style={{textAlign:'center',marginBottom:'3.5rem'}}>
            <div className="section-label">Lo que dicen los viajeros</div>
            <h2 className="section-h2">Experiencias que <em>inspiran</em></h2>
          </div>
          <div className="testimonials-grid">
            {[
              { stars:'★★★★★', text:'Reservar en Los Roques fue lo más fácil del mundo. La posada era exactamente como en las fotos y el posadero nos recibió como familia.', name:'Carlos M.', from:'Barcelona, España', initial:'C' },
              { stars:'★★★★★', text:'Me sorprendió poder pagar con Zelle desde Miami. La plataforma es clara y el equipo de RESER-VE te ayuda en todo momento.', name:'Valentina R.', from:'Miami, EE.UU.', initial:'V' },
              { stars:'★★★★★', text:'Mérida desde otro ángulo. La posada en Los Andes superó todas mis expectativas. Una experiencia completamente diferente a cualquier hotel.', name:'Pedro A.', from:'Caracas, Venezuela', initial:'P' },
            ].map((t, i) => (
              <div className={`testimonial-card reveal d${i+1}`} key={i}>
                <div className="testimonial-bar" />
                <div className="testimonial-stars">{t.stars}</div>
                <p className="testimonial-quote">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.initial}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-from">{t.from}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POSADEROS ────────────────────────────────────── */}
      <section id="posaderos" className="section">
        <div className="posadero-section">
          <div className="posadero-left reveal-left">
            <div className="section-label">Para posaderos</div>
            <h2 className="section-h2" style={{marginBottom:'0.6rem'}}>
              Tu posada merece <br /><em>visibilidad real</em>
            </h2>
            <p className="section-sub" style={{marginBottom:'0'}}>
              Deja de depender solo de WhatsApp. Muestra tu posada con imagen premium, recibe reservas con más confianza y cobra con total flexibilidad.
            </p>
            <div className="feature-list">
              {[
                'Fotografía profesional incluida en el paquete de digitalización',
                'Perfil activo visible para viajeros locales, internacionales y la diáspora venezolana',
                'Cobros flexibles vía Zelle, Pago Móvil, transferencia, Zinli o Binance',
                'Respaldado por la comunidad Dos Locos de Viaje',
              ].map((f,i) => (
                <div className="feature-item" key={i}>
                  <div className="feature-dot" />
                  <div className="feature-text">{f}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="posadero-right reveal-right">
            <div className="plan-card">
              <div className="plan-label">Paquete digitalización</div>
              <div className="plan-desc" style={{marginTop:'0.2rem', marginBottom:'0.6rem', fontSize:'0.9rem', color:'var(--indigo)', fontWeight:'600'}}>Contáctanos para más información sobre precios y disponibilidad.</div>
              <div className="plan-desc">Todo lo que necesitas para empezar a recibir reservas desde cualquier parte del mundo.</div>
              <ul className="plan-items">
                <li>Sesión fotográfica profesional</li>
                <li>Perfil completo en la plataforma</li>
                <li>Optimización visual y descripción</li>
                <li>1 mes de visibilidad premium</li>
              </ul>
              <a href="/registro-posada" className="btn-primary full-btn">Quiero digitalizar mi posada →</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── DARK CTA BAND ────────────────────────────────── */}
      <section className="dark-cta">
        <div className="dark-cta-bg-img" />
        <div className="dark-cta-glow" />
        <div className="dark-cta-inner">
          <div className="reveal">
            <h2>Venezuela te está <em>esperando.</em></h2>
            <p>Más de 49 posadas auténticas en los destinos más increíbles. Tu próxima aventura empieza con un solo clic.</p>
          </div>
          <div className="dark-cta-btns reveal d2">
            <a href="/buscar" className="btn-light">Explorar posadas →</a>
            <a href="/registro-posada" className="btn-outline-light">Registra tu posada</a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <img src="/images/logo-horizontal.svg" alt="RESER-VE" className="logo-img-footer" />
            <p>La primera plataforma especializada en posadas auténticas venezolanas. Conectamos viajeros con anfitriones locales extraordinarios.</p>
          </div>
          <div className="footer-col">
            <h4>Explorar</h4>
            <a href="/buscar">Todos los destinos</a>
            <a href="/destinos/los-roques">Los Roques</a>
            <a href="/destinos/merida">Mérida</a>
            <a href="/destinos/canaima">Canaima</a>
            <a href="/destinos/isla-margarita">Isla Margarita</a>
          </div>
          <div className="footer-col">
            <h4>Posaderos</h4>
            <a href="/registro-posada">Registra tu posada</a>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#">Paquete digitalización</a>
            <a href="#">Preguntas frecuentes</a>
          </div>
          <div className="footer-col">
            <h4>Contacto</h4>
            <a href="#">hola@reser-ve.com</a>
            <a href="#">WhatsApp</a>
            <a href="#">Instagram</a>
            <a href="#">Dos Locos de Viaje</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 RESER-VE · Impulsado por Dos Locos de Viaje</p>
          <div style={{display:'flex',gap:'1.5rem'}}>
            <a href="#">Términos</a>
            <a href="#">Privacidad</a>
            <a href="#">Sobre nosotros</a>
          </div>
        </div>
      </footer>
    </>
  )
}
