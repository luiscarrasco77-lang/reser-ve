'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { venezuelaLocations } from '@/lib/locations-ve'
import { normalizeStr } from '@/lib/search'
import { regions, findRegionsByQuery, type Region } from '@/lib/regions'
import NavUser from '@/components/NavUser'
import LangSwitch from '@/components/LangSwitch'
import { useLang } from '@/components/LangProvider'
import { LOCALE } from '@/lib/i18n'

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
  const { t, lang } = useLang()
  const [scrollY, setScrollY] = useState(0)
  const [progress, setProgress] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState<'viajero' | 'posadero'>('viajero')
  const [destinoBusqueda, setDestinoBusqueda] = useState('')
  const [mobOpen, setMobOpen] = useState(false)
  // Search bar state
  type SbSug = { label: string; sub: string; lat?: number; lng?: number; isStatic: boolean; isRegion?: boolean; regionId?: string }
  const [sbSuggestions, setSbSuggestions] = useState<SbSug[]>([])
  const [sbShowSug, setSbShowSug] = useState(false)
  const [sbSugLoading, setSbSugLoading] = useState(false)
  const [sbOverrideLat, setSbOverrideLat] = useState<number | undefined>()
  const [sbOverrideLng, setSbOverrideLng] = useState<number | undefined>()
  const [sbOverrideName, setSbOverrideName] = useState<string | undefined>()
  const [sbRegionId, setSbRegionId] = useState<string>('')
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

  const [stats, setStats] = useState<{ posadas: number; destinos: number; reviews: number; ratingPromedio: number } | null>(null)
  const [destCounts, setDestCounts] = useState<Record<string, number>>({})
  useEffect(() => {
    // Respaldo: si el IntersectionObserver no dispara, anima los contadores igual (nunca se quedan en 0).
    const t = setTimeout(() => setStatsVisible(true), 1800)
    fetch('/api/stats').then(r => r.ok ? r.json() : null).then(d => { if (d) setStats(d) }).catch(() => {})
    fetch('/api/posadas').then(r => r.ok ? r.json() : []).then((list: { destinoSlug: string }[]) => {
      if (!Array.isArray(list)) return
      const counts: Record<string, number> = {}
      for (const p of list) counts[p.destinoSlug] = (counts[p.destinoSlug] ?? 0) + 1
      setDestCounts(counts)
    }).catch(() => {})
    return () => clearTimeout(t)
  }, [])
  const destCount = (slug: string | null) => slug && destCounts[slug] ? t(destCounts[slug] > 1 ? '{n} posadas' : '{n} posada', { n: destCounts[slug] }) : null

  const c1 = useCounter(stats?.posadas ?? 11, statsVisible)
  const c3 = useCounter(stats?.destinos ?? 8, statsVisible)

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
    const regionMatches = findRegionsByQuery(q)
      .slice(0, 3)
      .map(r => ({ label: r.nombre, sub: r.sub, lat: r.lat, lng: r.lng, isStatic: true, isRegion: true, regionId: r.id }))
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      const nomMatches = data.slice(0, 8).map((r: any) => {
        const addr = r.address
        const sub = [addr?.state, addr?.municipality || addr?.city || addr?.town || addr?.village]
          .filter(Boolean).join(', ') || 'Venezuela'
        return { label: r.display_name.split(',')[0].trim(), sub, lat: parseFloat(r.lat), lng: parseFloat(r.lon), isStatic: false }
      }).filter((n: any) => !staticMatches.some(s => s.label.toLowerCase() === n.label.toLowerCase()))
      setSbSuggestions([...regionMatches, ...staticMatches, ...nomMatches].slice(0, 8))
    } catch {
      setSbSuggestions([...regionMatches, ...staticMatches].slice(0, 8))
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
    return d.toLocaleDateString(LOCALE[lang], { day: 'numeric', month: 'short' })
  }

  const MONTHS_SHORT_LBL = lang === 'en' ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] : ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const sbDateLabel = sbFlexible
    ? sbFlexMonths.length > 0
      ? sbFlexMonths.slice(0,2).map(m => {
          const [y, mo] = m.split('-').map(Number)
          const today = new Date()
          return MONTHS_SHORT_LBL[mo-1] + (today.getFullYear() !== y ? ` ${y}` : '')
        }).join(', ') + (sbFlexMonths.length > 2 ? '…' : '')
      : sbFlexWeeks > 0
        ? t(sbFlexWeeks > 1 ? '{n} semanas' : '{n} semana', { n: sbFlexWeeks })
        : t('Fechas flexibles')
    : sbCheckIn && sbCheckOut
      ? `${sbFmtDate(sbCheckIn)} – ${sbFmtDate(sbCheckOut)}`
      : sbCheckIn ? `${sbFmtDate(sbCheckIn)} – ${t('Salida')}` : t('Fechas')

  const sbNights = sbCheckIn && sbCheckOut
    ? Math.round((sbCheckOut.getTime() - sbCheckIn.getTime()) / 86400000) : 0

  function sbAddMonths(d: Date, n: number) { const r = new Date(d); r.setMonth(r.getMonth() + n); return r }

  function sbIsSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  }

  const MONTH_NAMES_SB = lang === 'en' ? ['January','February','March','April','May','June','July','August','September','October','November','December'] : ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
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
          {(lang === 'en' ? ['Su','Mo','Tu','We','Th','Fr','Sa'] : ['Do','Lu','Ma','Mi','Ju','Vi','Sá']).map(d => <div key={d} className="sb-cal-dname">{d}</div>)}
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
    if (sbRegionId)                  params.set('regionId', sbRegionId)
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

  function selectVenezuela() {
    setDestinoBusqueda('')
    setSbOverrideLat(undefined)
    setSbOverrideLng(undefined)
    setSbOverrideName(undefined)
    setSbRegionId('')
    setSbShowSug(false)
    router.push('/buscar')
  }

  function selectRegionSug(r: Region) {
    setDestinoBusqueda(r.nombre)
    setSbOverrideLat(r.lat)
    setSbOverrideLng(r.lng)
    setSbOverrideName(r.nombre)
    setSbRegionId(r.id)
    setSbShowSug(false)
  }

  const POPULAR_DEST = ['Los Roques', 'Isla Margarita', 'Canaima', 'Mochima', 'Caracas', 'Choroní', 'Mérida']

  const destinos: { name: string; slug: string | null; tag: string; count: string; img: string; wide?: boolean }[] = [
    { name: 'Los Roques', slug: 'los-roques', tag: 'Archipiélago', count: destCount('los-roques') ?? '', img: '/images/Archipielago.webp' },
    { name: 'Mérida', slug: 'merida', tag: 'Los Andes', count: destCount('merida') ?? '', img: '/images/Guacamaya.webp' },
    { name: 'Mochima', slug: 'mochima', tag: 'Costa Oriental', count: destCount('mochima') ?? '', img: '/images/Mochima.webp' },
    { name: 'Morrocoy', slug: 'morrocoy', tag: 'Costa Occidental', count: destCount('morrocoy') ?? '', img: '/images/CayoSombero.webp' },
    { name: 'Canaima', slug: 'canaima', tag: 'Gran Sabana', count: destCount('canaima') ?? '', img: '/images/KerepaKupaiWena.webp' },
    { name: 'Isla Margarita', slug: 'isla-margarita', tag: 'Caribe', count: destCount('isla-margarita') ?? '', img: '/images/PlayaElAgua.webp' },
    { name: t('Todos los destinos'), slug: null, tag: 'Venezuela', count: t('Gran Sabana, Coro, Choroní y más'), img: '/images/PlayaElIndio.webp', wide: true },
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
          position:fixed; top:var(--pp-h,0px); left:0; height:3px; z-index:650;
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
          position:fixed; top:var(--pp-h,0px); left:0; right:0; z-index:600;
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
        .mob-menu-btn{display:none;background:none;border:none;cursor:pointer;padding:0.3rem;color:inherit;}
        .mob-menu-btn svg{display:block;}
        .mob-drawer{position:fixed;inset:0;z-index:700;pointer-events:none;}
        .mob-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.45);opacity:0;transition:opacity 0.25s;}
        .mob-panel{position:absolute;top:0;right:0;bottom:0;width:min(300px,85vw);background:#FDFBF7;transform:translateX(100%);transition:transform 0.28s cubic-bezier(0.16,1,0.3,1);display:flex;flex-direction:column;padding:1.5rem;}
        .mob-drawer.open{pointer-events:all;}
        .mob-drawer.open .mob-overlay{opacity:1;}
        .mob-drawer.open .mob-panel{transform:translateX(0);}
        .mob-close{align-self:flex-end;background:none;border:none;cursor:pointer;padding:0.25rem;color:var(--indigo);margin-bottom:1.5rem;}
        .mob-link{font-size:1rem;font-weight:600;color:var(--indigo);text-decoration:none;padding:0.85rem 0;border-bottom:1px solid rgba(26,43,76,0.07);display:block;}
        .mob-link:last-of-type{border-bottom:none;}
        @media(max-width:768px){.nav-links{display:none;} .nav{padding:1rem;} .nav.scrolled{padding:0.75rem 1rem;} .mob-menu-btn{display:block;}}
        .mob-lang{display:none;align-items:center;gap:.6rem;}
        @media(max-width:768px){.mob-lang{display:flex;} .reveal-left,.reveal-right{transform:translateY(28px);}}

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
          z-index:600; overflow:hidden;
        }
        .sb-suggest { min-width:300px; max-height:380px; overflow-y:auto; scrollbar-width:thin; scrollbar-color:rgba(26,43,76,0.15) transparent; }
        .sb-sug-item { display:flex; align-items:center; gap:0.7rem; padding:0.8rem 1rem; font-size:0.88rem; color:#1A2B4C; cursor:pointer; transition:background 0.14s; }
        .sb-sug-item:hover { background:rgba(26,43,76,0.04); }
        .sb-sug-reg { font-size:0.72rem; color:rgba(26,43,76,0.45); margin-left:auto; padding-left:0.4rem; white-space:nowrap; }
        /* Pre-state suggestion headers */
        .sb-sug-hdr { padding: 0.62rem 1rem 0.3rem; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: var(--muted); }
        .sb-sug-section-hdr { padding: 0.55rem 1rem 0.2rem; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: var(--muted); border-top: 1px solid var(--line); margin-top: 0.2rem; }
        /* Suggestion row reuse */
        .sb-sug-row-landing { display:flex; align-items:center; gap:0.7rem; padding:0.72rem 1rem; font-size:0.88rem; color:#1A2B4C; cursor:pointer; transition:background 0.14s; }
        .sb-sug-row-landing:hover { background:rgba(26,43,76,0.04); }
        .sb-sug-icon-sm { font-size:0.85rem; flex-shrink:0; color:rgba(26,43,76,0.45); display:flex; }
        .sb-sug-main-col { flex:1; min-width:0; }
        .sb-sug-name-txt { display:block; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .sb-sug-sub-txt { display:block; font-size:0.71rem; color:rgba(26,43,76,0.45); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .sb-sug-badge-region { font-size:0.6rem; font-weight:700; padding:0.12rem 0.38rem; border-radius:999px; background:rgba(230,126,34,0.1); color:#E67E22; flex-shrink:0; }
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
        .section { padding:3.5rem 1.5rem; max-width:min(1100px,100%); margin:0 auto; }
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
        .testimonials-section { background:var(--cream); padding:4rem 1.5rem; }
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
          padding:4.5rem 1.5rem;
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
          .section{padding:3rem 1rem;}
          .posadero-section{padding:2rem;gap:2rem;}
          .dark-cta{padding:3.5rem 1rem;}
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
          <a href="/aurora" className="nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><img src="/images/aurora/aurora.svg" alt="" width={22} height={22} style={{ borderRadius: '50%' }} />{t('Sueña tu viaje')}</a>
          <a href="/buscar" className="nav-link">{t('Destinos')}</a>
          <a href="/posaderos" className="nav-link">{t('Posaderos')}</a>
          <a href="#como-funciona" className="nav-link">{t('Cómo funciona')}</a>
          <NavUser dark={scrollY < 60} />
        </div>
        <div className="mob-lang">
          <LangSwitch dark={scrollY < 60} />
          <button className="mob-menu-btn" onClick={() => setMobOpen(true)} aria-label={t('Menú')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={scrollY < 60 ? 'white' : '#1A2B4C'} strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div className={`mob-drawer${mobOpen ? ' open' : ''}`}>
        <div className="mob-overlay" onClick={() => setMobOpen(false)} />
        <div className="mob-panel">
          <button className="mob-close" onClick={() => setMobOpen(false)} aria-label={t('Cerrar')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A2B4C" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <a href="/aurora" className="mob-link" onClick={() => setMobOpen(false)}>{t('Sueña tu viaje con Aurora')}</a>
          <a href="/buscar" className="mob-link" onClick={() => setMobOpen(false)}>{t('Destinos')}</a>
          <a href="/posaderos" className="mob-link" onClick={() => setMobOpen(false)}>{t('Posaderos')}</a>
          <a href="/vision" className="mob-link" onClick={() => setMobOpen(false)}>{t('Sobre nosotros')}</a>
          <a href="#como-funciona" className="mob-link" onClick={() => setMobOpen(false)}>{t('Cómo funciona')}</a>
          <a href="/faq" className="mob-link" onClick={() => setMobOpen(false)}>{t('Preguntas frecuentes')}</a>
          <div style={{marginTop:'1.5rem'}}>
            <NavUser dark={false} hideLang />
          </div>
        </div>
      </div>

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
            <h1 className={`hero-h1 ${loaded ? 'anim-1' : ''}`}>
              {t('Encuentra tu')} <em>{t('posada')}</em><br />{t('en Venezuela')}
            </h1>
            <p className={`hero-sub ${loaded ? 'anim-2' : ''}`}>
              {t('Posadas familiares de Los Roques a la Gran Sabana. Compara fotos, precios y formas de pago, y paga exactamente el precio publicado.')}
            </p>
            <div className={`hero-btns ${loaded ? 'anim-3' : ''}`}>
              <a href="/buscar" className="btn-primary">{t('Ver posadas')}</a>
              <a href="/posaderos" className="btn-secondary">{t('Publica tu posada')}</a>
            </div>
            {/* Slide indicators — inline below buttons, no overlap with search bar */}
            <div className="slide-dots">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  className={`slide-dot${i === slideIdx ? ' active' : ''}`}
                  onClick={() => { setSlideIdx(i); setSlideKey(k => k + 1) }}
                  aria-label={t('Foto {n}', { n: i + 1 })}
                />
              ))}
            </div>
          </div>
        </div>

        <div className={`search-wrap ${loaded ? 'anim-4' : ''}`}>
          <div className="sb-bar">

            {/* Location */}
            <div className="sb-seg" style={{ flex: '1.6' }}>
              <div className="sb-seg-lbl">{t('Destino')}</div>
              <input
                ref={sbInputRef}
                className="sb-input"
                placeholder={t('¿A dónde vas?')}
                value={destinoBusqueda}
                onChange={e => { setDestinoBusqueda(e.target.value); setSbShowSug(true); setSbOverrideLat(undefined); setSbOverrideLng(undefined); setSbOverrideName(undefined) }}
                onFocus={() => setSbShowSug(true)}
                autoComplete="off"
              />
              {sbShowSug && (
                <div className="sb-suggest" ref={sbSugRef}>
                  {destinoBusqueda === '' ? (
                    /* Pre-state: show Venezuela + popular + regions */
                    <>
                      <div className="sb-sug-hdr">{t('Sugerencias de destinos')}</div>
                      <div className="sb-sug-row-landing" onMouseDown={() => { selectVenezuela() }}>
                        <span className="sb-sug-icon-sm">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        </span>
                        <div className="sb-sug-main-col">
                          <span className="sb-sug-name-txt">{t('Buscar en toda Venezuela')}</span>
                          <span className="sb-sug-sub-txt">{t('Ver todas las posadas disponibles')}</span>
                        </div>
                      </div>
                      <div className="sb-sug-section-hdr">{t('Popular')}</div>
                      {POPULAR_DEST.map(name => {
                        const loc = venezuelaLocations.find(l => l.nombre === name)
                        if (!loc) return null
                        return (
                          <div key={name} className="sb-sug-row-landing" onMouseDown={() => {
                            setDestinoBusqueda(name)
                            setSbOverrideLat(loc.lat); setSbOverrideLng(loc.lng); setSbOverrideName(name)
                            setSbRegionId(''); setSbShowSug(false)
                          }}>
                            <span className="sb-sug-icon-sm">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="rgba(26,43,76,0.45)"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                            </span>
                            <div className="sb-sug-main-col">
                              <span className="sb-sug-name-txt">{name}</span>
                              <span className="sb-sug-sub-txt">{t(loc.region)}</span>
                            </div>
                          </div>
                        )
                      })}
                      <div className="sb-sug-section-hdr">{t('Regiones')}</div>
                      {regions.map(r => (
                        <div key={r.id} className="sb-sug-row-landing" onMouseDown={() => selectRegionSug(r)}>
                          <span className="sb-sug-icon-sm">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
                          </span>
                          <div className="sb-sug-main-col">
                            <span className="sb-sug-name-txt">{t(r.nombre)}</span>
                            <span className="sb-sug-sub-txt">{r.sub}</span>
                          </div>
                          <span className="sb-sug-badge-region">{t('Región')}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    /* Query typed: show matches */
                    <>
                      {sbSugLoading && sbSuggestions.length === 0 && (
                        <div className="sb-sug-item" style={{color:'rgba(26,43,76,0.45)',fontSize:'0.82rem'}}>
                          {t('Buscando en Venezuela…')}
                        </div>
                      )}
                      {sbSuggestions.map((s, i) => (
                        <div key={i} className="sb-sug-item"
                          onMouseDown={() => {
                            if (s.isRegion && s.regionId) {
                              selectRegionSug({ id: s.regionId, nombre: s.label, lat: s.lat!, lng: s.lng!, sub: s.sub, keywords: [] })
                            } else {
                              setDestinoBusqueda(s.label)
                              setSbOverrideLat(s.lat); setSbOverrideLng(s.lng); setSbOverrideName(s.label)
                              setSbRegionId(''); setSbShowSug(false)
                            }
                          }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="rgba(26,43,76,0.45)" style={{flexShrink:0}}>
                            {s.isRegion
                              ? <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" fill="none" stroke="rgba(26,43,76,0.45)" strokeWidth="2"/><line x1="8" y1="2" x2="8" y2="18" stroke="rgba(26,43,76,0.45)" strokeWidth="2"/><line x1="16" y1="6" x2="16" y2="22" stroke="rgba(26,43,76,0.45)" strokeWidth="2"/></>
                              : <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            }
                          </svg>
                          <span style={{flex:1,minWidth:0}}>
                            <span style={{display:'block',fontWeight:500}}>{s.isRegion ? t(s.label) : s.label}</span>
                            <span style={{fontSize:'0.71rem',color:'rgba(26,43,76,0.45)'}}>{s.sub}</span>
                          </span>
                          {s.isRegion
                            ? <span className="sb-sug-badge-region">{t('Región')}</span>
                            : s.isStatic && <span style={{fontSize:'0.6rem',fontWeight:700,padding:'0.12rem 0.38rem',borderRadius:'999px',background:'rgba(230,126,34,0.1)',color:'#E67E22',flexShrink:0}}>{t('Popular')}</span>
                          }
                        </div>
                      ))}
                      {!sbSugLoading && sbSuggestions.length === 0 && destinoBusqueda.length > 1 && (
                        <div className="sb-sug-item" style={{color:'rgba(26,43,76,0.45)',fontSize:'0.82rem'}}>
                          {t('Sin resultados para «{q}»', { q: destinoBusqueda })}
                        </div>
                      )}
                    </>
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
              <div className="sb-seg-lbl">{t('Fechas')}</div>
              <div className={`sb-seg-val ${!sbCheckIn && !sbFlexible ? 'ph' : ''}`}>{sbDateLabel}</div>

              {sbShowDate && (
                <div className="sb-date-panel" onClick={e => e.stopPropagation()}>
                  <div className="sb-date-modes">
                    <button className={`sb-mode-btn ${!sbFlexible ? 'on' : ''}`} onClick={() => { setSbFlexible(false); setSbFlexMonths([]); setSbFlexWeeks(0) }}>{t('Fechas exactas')}</button>
                    <button className={`sb-mode-btn ${sbFlexible ? 'on' : ''}`} onClick={() => { setSbFlexible(true); setSbCheckIn(null); setSbCheckOut(null) }}>{t('Fechas flexibles')}</button>
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
                          {sbNights > 0 ? `${t(sbNights > 1 ? '{n} noches' : '{n} noche', { n: sbNights })}: ${sbFmtDate(sbCheckIn)} – ${sbFmtDate(sbCheckOut)}`
                            : sbDateStep === 'in' ? t('Selecciona entrada') : t('Selecciona salida')}
                        </span>
                        <button className="sb-date-clear" onClick={() => { setSbCheckIn(null); setSbCheckOut(null); setSbDateStep('in') }}>{t('Borrar')}</button>
                      </div>
                    </>
                  ) : (
                    /* Flexible picker — Airbnb style */
                    (() => {
                      const today = new Date()
                      const MONTHS_SHORT_ES = MONTHS_SHORT_LBL
                      const upcoming18 = Array.from({length:18},(_,i)=>{
                        const d=new Date(today.getFullYear(),today.getMonth()+i,1)
                        const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
                        return {key,label:MONTHS_SHORT_ES[d.getMonth()],year:d.getFullYear()}
                      })
                      return (
                        <>
                          <div className="sb-flex-tabs">
                            <button className={`sb-flex-tab${sbFlexType==='meses'?' on':''}`} onClick={()=>setSbFlexType('meses')}>{t('Meses')}</button>
                            <button className={`sb-flex-tab${sbFlexType==='semanas'?' on':''}`} onClick={()=>setSbFlexType('semanas')}>{t('Semanas')}</button>
                          </div>
                          {sbFlexType==='meses' ? (
                            <>
                              <p className="sb-flex-hint">{t('¿En qué mes quieres viajar?')}</p>
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
                                  onClick={()=>setSbFlexMonths([])}>{t('Borrar selección')}</button>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="sb-flex-hint">{t('¿Cuánto tiempo quieres quedarte?')}</p>
                              <div className="sb-flex-weeks">
                                {([{v:0,l:t('Cualquier semana')},{v:1,l:t('{n} semana',{n:1})},{v:2,l:t('{n} semanas',{n:2})},{v:3,l:t('{n} semanas',{n:3})},{v:4,l:t('{n} semanas',{n:4})}]).map(({v,l})=>(
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
              <div className="sb-seg-lbl">{t('Pago')}</div>
              <div className={`sb-seg-val ${!sbPago ? 'ph' : ''}`}>{sbPago ? t(sbPago) : t('Cualquier opción')}</div>
              {sbShowPay && (
                <div className="sb-pay-panel" onClick={e => e.stopPropagation()}>
                  {[
                    { v: '', l: t('Cualquier opción') },
                    { v: 'Zelle', l: 'Zelle' },
                    { v: 'Transferencia', l: t('Transferencia bancaria') },
                    { v: 'Efectivo USD', l: t('Efectivo USD') },
                    { v: 'Efectivo Bs', l: t('Efectivo Bs') },
                    { v: 'Tarjeta', l: t('Tarjeta de crédito') },
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
              {t('Buscar')}
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
              <div className="mosaic-tag">{t('Archipiélago')}</div>
              <div>Los Roques</div>
            </div>
          </a>
          <a href="/buscar" className="mosaic-item" style={{textDecoration:'none'}}>
            <img
              src="/images/Waku-lodge-facilities-.webp"
              alt={t('Habitación de una posada en Canaima')}
              loading="lazy"
            />
            <div className="mosaic-label">
              <div className="mosaic-tag">{t('Alojamiento')}</div>
              <div>{t('Posadas familiares')}</div>
            </div>
          </a>
          <a href="/destinos/canaima" className="mosaic-item" style={{textDecoration:'none'}}>
            <img
              src="/images/UruyenI.webp"
              alt="Canaima"
              loading="lazy"
            />
            <div className="mosaic-label">
              <div className="mosaic-tag">{t('Gran Sabana')}</div>
              <div>Canaima</div>
            </div>
          </a>
        </div>
      </section>

      {/* ── QUÉ ES UNA POSADA ────────────────────────────── */}
      <section className="section">
        <div className="split-section">
          <div className="split-photo reveal-left">
            <img
              src="/images/lodge-canaima_01.webp"
              alt={t('Posada en Canaima')}
              loading="lazy"
            />
          </div>
          <div className="split-text reveal-right">
            <div className="section-label">{t('Sobre las posadas')}</div>
            <h2 className="section-h2">{t('¿Qué es una posada?')}</h2>
            <p className="section-sub" style={{marginBottom:'0'}}>
              {t('Un alojamiento pequeño, casi siempre familiar. Los dueños viven en el lugar o cerca, conocen bien la zona y atienden en persona. Suelen tener pocas habitaciones, desayuno casero y precios más accesibles que un hotel.')}
            </p>
            <div className="feature-grid">
              {([
                {
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cacao)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
                  title:t('Bien ubicadas'), desc:t('Frente al mar, en la montaña o junto a los parques nacionales')
                },
                {
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cacao)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                  title:t('Atención de los dueños'), desc:t('Te recomiendan tours, traslados y dónde comer')
                },
                {
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cacao)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
                  title:t('Pago en USD o Bs'), desc:t('Zelle, Pago Móvil, transferencia o efectivo, según la posada')
                },
                {
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cacao)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
                  title:t('Revisadas'), desc:t('Cada posada pasa por nuestro equipo antes de publicarse')
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
          <div className="section-label">{t('Cómo funciona')}</div>
          <h2 className="section-h2">{t('Así funciona RESER-VE')}</h2>
          <p className="section-sub">{t('Estamos en fase privada: las posadas ya se están publicando y las reservas abren pronto.')}</p>
        </div>
        <div className="reveal d1">
          <div className="tabs">
            <button className={`tab-btn ${activeTab === 'viajero' ? 'active' : ''}`} onClick={() => setActiveTab('viajero')}>
              {t('Soy viajero')}
            </button>
            <button className={`tab-btn ${activeTab === 'posadero' ? 'active' : ''}`} onClick={() => setActiveTab('posadero')}>
              {t('Tengo una posada')}
            </button>
          </div>
        </div>

        {activeTab === 'viajero' ? (
          <div className="steps-grid">
            {[
              [t('Busca'), t('Filtra por destino, precio y forma de pago, o mira las posadas en el mapa.')],
              [t('Compara'), t('Revisa fotos, servicios, políticas y ubicación de cada posada.')],
              [t('Solicita'), t('El posadero confirma en menos de 24 horas y te envía sus datos de pago por el chat.')],
              [t('Viaja'), t('Pagas a la posada, te hospedas y al volver puedes dejar tu reseña.')],
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
            {[
              [t('Crea tu cuenta'), t('Regístrate como posadero. Publicar es gratis y no hay mensualidad.')],
              [t('Publica tu posada'), t('Sube fotos, precios, habitaciones y las formas de pago que aceptas.')],
              [t('La revisamos'), t('Nuestro equipo la revisa en 24 a 72 horas y te avisa por correo.')],
              [t('Recibe solicitudes'), t('Confirmas cada reserva desde tu panel y hablas con el huésped por el chat.')],
            ].map(([t, d], i) => (
              <div className={`step-card anim-${i+1}`} key={i}>
                <div className="step-num">0{i + 1}</div>
                <div className="step-title">{t}</div>
                <div className="step-desc">{d}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="divider" />

      {/* ── DESTINOS ─────────────────────────────────────── */}
      <section id="destinos" className="section">
        <div className="reveal">
          <div className="section-label">{t('Destinos')}</div>
          <h2 className="section-h2">{t('Explora por destino')}</h2>
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
                <div className="dest-tag">{t(d.tag)}</div>
                <div className="dest-name">{d.name}</div>
                <div className="dest-count">{d.count}</div>
              </div>
              <div className="dest-arrow">→</div>
            </a>
          ))}
        </div>
      </section>



      {/* ── POSADEROS ────────────────────────────────────── */}
      <section id="posaderos" className="section">
        <div className="posadero-section">
          <div className="posadero-left reveal-left">
            <div className="section-label">{t('Para posaderos')}</div>
            <h2 className="section-h2" style={{marginBottom:'0.6rem'}}>
              {t('¿Tienes una posada?')}
            </h2>
            <p className="section-sub" style={{marginBottom:'0'}}>
              {t('Publícala gratis y llega a viajeros de Venezuela y del exterior que buscan dónde quedarse. Solo pagas una comisión cuando recibes una reserva confirmada.')}
            </p>
            <div className="feature-list">
              {[
                t('Sin mensualidad ni costo de alta'),
                t('Tu propia página con fotos, servicios, políticas y ubicación'),
                t('Calendario por habitaciones sincronizado con Booking, Airbnb y Google Calendar'),
                t('Cobras como siempre: Zelle, Pago Móvil, transferencia o efectivo'),
              ].map((f,i) => (
                <div className="feature-item" key={i}>
                  <div className="feature-dot" />
                  <div className="feature-text">{f}</div>
                </div>
              ))}
              <div className="feature-item">
                <div className="feature-dot" />
                <div className="feature-text">{t('Proyecto respaldado por')} <a href="https://www.instagram.com/doslocosdeviaje/" target="_blank" rel="noopener noreferrer" style={{color:'inherit',textDecoration:'underline',textUnderlineOffset:'2px'}}>Dos Locos de Viaje</a></div>
              </div>
            </div>
          </div>
          <div className="posadero-right reveal-right">
            <div className="plan-card">
              <div className="plan-label">{t('Empezar toma unos 10 minutos')}</div>
              <ul className="plan-items">
                <li>{t('Crea tu cuenta de posadero')}</li>
                <li>{t('Completa los datos y sube tus fotos')}</li>
                <li>{t('Envíala a revisión')}</li>
              </ul>
              <a href="/register?role=host" className="btn-primary full-btn">{t('Publicar mi posada')}</a>
              <a href="/docs/Guia-Posaderos-RESER-VE.pdf" target="_blank" rel="noopener" style={{display:'block',textAlign:'center',marginTop:'0.8rem',fontSize:'0.84rem',color:'var(--muted)'}}>{t('Descargar la guía para posaderos (PDF)')}</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <img src="/images/logo-horizontal.svg" alt="RESER-VE" className="logo-img-footer" />
            <p>{t('Reserva posadas en Venezuela, directamente con sus dueños.')}</p>
          </div>
          <div className="footer-col">
            <h4>{t('Explorar')}</h4>
            <a href="/buscar">{t('Todos los destinos')}</a>
            <a href="/destinos/los-roques">Los Roques</a>
            <a href="/destinos/merida">Mérida</a>
            <a href="/destinos/canaima">Canaima</a>
            <a href="/destinos/isla-margarita">Isla Margarita</a>
          </div>
          <div className="footer-col">
            <h4>{t('Posaderos')}</h4>
            <a href="/register?role=host">{t('Registra tu posada')}</a>
            <a href="/posaderos">{t('Cómo funciona')}</a>
            <a href="/docs/Guia-Posaderos-RESER-VE.pdf" target="_blank" rel="noopener">{t('Guía para posaderos (PDF)')}</a>
            <a href="/faq">{t('Preguntas frecuentes')}</a>
          </div>
          <div className="footer-col">
            <h4>{t('Contacto')}</h4>
            <a href="mailto:hola@reser-ve.com">hola@reser-ve.com</a>
            <a href="https://www.instagram.com/doslocosdeviaje/" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="/faq">{t('Centro de ayuda')}</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 RESER-VE · {t('Respaldado por')} <a href="https://www.instagram.com/doslocosdeviaje/" target="_blank" rel="noopener noreferrer" style={{color:'inherit',textDecoration:'underline',textUnderlineOffset:'2px'}}>Dos Locos de Viaje</a></p>
          <div style={{display:'flex',gap:'1.5rem'}}>
            <a href="/terminos">{t('Términos')}</a>
            <a href="/privacidad">{t('Privacidad')}</a>
            <a href="/vision">{t('Sobre nosotros')}</a>
          </div>
        </div>
      </footer>

      {/* El servicio al cliente ahora es el asistente IA flotante global (components/SupportChat) */}
    </>
  )
}
