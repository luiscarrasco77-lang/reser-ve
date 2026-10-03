'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardNav from '@/components/DashboardNav'
import { CHANNELS, channel } from '@/lib/channels'

type Item = { kind: 'booking' | 'block'; id: number; start: string; end: string; rooms: number; label: string; source: string; status?: string; synced?: boolean }
type Block = { id: number; startDate: string; endDate: string; rooms: number; source: string; note: string | null }
type Feed = { id: number; name: string; source: string; url: string; rooms: number; lastSyncAt: string | null; lastStatus: string | null }
type Data = {
  posadas: { slug: string; nombre: string; status: string; isDemo?: boolean }[]
  posada: { slug: string; nombre: string; habitaciones: number; isDemo?: boolean } | null
  isAdmin?: boolean
  month: string
  days: { date: string; used: number }[]
  items: Item[]
  manual: Block[]
  feeds: Feed[]
  exportUrl: string
}

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
// Orígenes que el posadero puede elegir al anotar una reserva externa.
const SOURCES = CHANNELS.filter(c => !['reserve', 'google'].includes(c.key))
const FEED_SOURCES = [
  { key: 'booking', label: 'Booking' }, { key: 'airbnb', label: 'Airbnb' }, { key: 'expedia', label: 'Expedia' },
  { key: 'google', label: 'Google Calendar' }, { key: 'otro', label: 'Otro' },
]

function shiftMonth(m: string, n: number) {
  const [y, mo] = m.split('-').map(Number)
  const d = new Date(Date.UTC(y, mo - 1 + n, 1))
  return d.toISOString().slice(0, 7)
}
function addDays(date: string, n: number) {
  const d = new Date(date + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10)
}
function fmt(d: string) {
  const [, m, day] = d.split('-').map(Number)
  return `${day} ${MONTHS[m - 1].slice(0, 3)}`
}

function CalendarioInner() {
  const router = useRouter()
  const sp = useSearchParams()
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const slug = sp.get('posada') ?? ''

  // Selección de rango en el calendario
  const [selStart, setSelStart] = useState<string | null>(null)
  const [selEnd, setSelEnd] = useState<string | null>(null) // última noche seleccionada (inclusive)
  const [rooms, setRooms] = useState(1)
  const [source, setSource] = useState('whatsapp')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // Sincronización
  const [feedSource, setFeedSource] = useState('booking')
  const [feedUrl, setFeedUrl] = useState('')
  const [feedRooms, setFeedRooms] = useState(1)
  const [feedBusy, setFeedBusy] = useState(false)
  const [feedMsg, setFeedMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const q = new URLSearchParams({ month, ...(slug ? { posada: slug } : {}) })
    const res = await fetch(`/api/host/calendar?${q}`).catch(() => null)
    setData(res?.ok ? await res.json() : null)
    setLoading(false)
  }, [month, slug])
  useEffect(() => { load() }, [load])

  const total = data?.posada?.habitaciones ?? 1
  const today = new Date().toISOString().slice(0, 10)
  const usedMap = useMemo(() => new Map((data?.days ?? []).map(d => [d.date, d.used])), [data])
  const overbooked = (data?.days ?? []).filter(d => d.used > total && d.date >= today)
  // Canales presentes cada día (puntos de color) y resumen de noches por canal del mes.
  const { daySources, summary } = useMemo(() => {
    const ds = new Map<string, Set<string>>()
    const sum = new Map<string, number>()
    for (const it of data?.items ?? []) {
      for (let d = it.start; d < it.end; d = addDays(d, 1)) {
        if (!d.startsWith(month)) continue
        if (!ds.has(d)) ds.set(d, new Set())
        ds.get(d)!.add(it.source)
        sum.set(it.source, (sum.get(it.source) ?? 0) + it.rooms)
      }
    }
    return { daySources: ds, summary: [...sum.entries()].sort((a, b) => b[1] - a[1]) }
  }, [data, month])

  // Celdas del mes (lunes primero)
  const cells = useMemo(() => {
    const first = `${month}-01`
    const dow = (new Date(first + 'T00:00:00Z').getUTCDay() + 6) % 7
    const out: (string | null)[] = Array(dow).fill(null)
    for (let d = first; d.startsWith(month); d = addDays(d, 1)) out.push(d)
    while (out.length % 7) out.push(null)
    return out
  }, [month])

  function clickDay(d: string) {
    setMsg('')
    // 1er toque: llegada. 2º toque: última noche. Un 3er toque empieza de nuevo.
    if (!selStart || selEnd) { setSelStart(d); setSelEnd(null); return }
    if (d < selStart) { setSelStart(d); return }
    setSelEnd(d)
  }
  const lastNight = selEnd ?? selStart
  const inSel = (d: string) => !!selStart && !!lastNight && d >= selStart && d <= lastNight

  async function saveBlock() {
    if (!data?.posada || !selStart || !lastNight) return
    setSaving(true); setMsg('')
    const res = await fetch('/api/host/calendar/blocks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ posada: data.posada.slug, start: selStart, end: addDays(lastNight!, 1), rooms, source, note }),
    })
    const out = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) { setMsg(out.error ?? 'No se pudo guardar'); return }
    setSelStart(null); setSelEnd(null); setNote(''); setRooms(1)
    load()
  }

  async function removeBlock(id: number) {
    if (!data?.posada || !confirm('¿Quitar esta ocupación del calendario?')) return
    await fetch(`/api/host/calendar/blocks?id=${id}&posada=${data.posada.slug}`, { method: 'DELETE' })
    load()
  }

  async function addFeed() {
    if (!data?.posada) return
    setFeedBusy(true); setFeedMsg('')
    const res = await fetch('/api/host/calendar/feeds', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ posada: data.posada.slug, source: feedSource, name: FEED_SOURCES.find(f => f.key === feedSource)?.label, url: feedUrl, rooms: feedRooms }),
    })
    const out = await res.json().catch(() => ({}))
    setFeedBusy(false)
    if (!res.ok) { setFeedMsg(out.error ?? 'No se pudo conectar'); return }
    setFeedUrl(''); setFeedMsg(`Conectado: ${out.count} reserva${out.count === 1 ? '' : 's'} importada${out.count === 1 ? '' : 's'}.`)
    load()
  }
  async function syncNow() {
    if (!data?.posada) return
    setFeedBusy(true); setFeedMsg('')
    await fetch('/api/host/calendar/feeds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ posada: data.posada.slug, action: 'sync' }) })
    setFeedBusy(false); setFeedMsg('Calendarios actualizados.')
    load()
  }
  async function removeFeed(id: number) {
    if (!data?.posada || !confirm('¿Desconectar este calendario? Se quitarán sus reservas importadas.')) return
    await fetch(`/api/host/calendar/feeds?id=${id}&posada=${data.posada.slug}`, { method: 'DELETE' })
    load()
  }

  const [y, m] = month.split('-').map(Number)
  const monthItems = [...(data?.items ?? [])].sort((a, b) => a.start.localeCompare(b.start))

  return (
    <>
      <style>{`
        :root{--indigo:#1A2B4C;--cacao:#E67E22;--cacao-dark:#C96510;--sand:#FDFBF7;--muted:#7A8699;--line:rgba(26,43,76,0.09);}
        body{font-family:'Inter',system-ui,sans-serif;background:var(--sand);color:var(--indigo);margin:0;}
        .wrap{max-width:1080px;margin:0 auto;padding:2rem 1.25rem 4rem;}
        .head{display:flex;align-items:flex-end;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1.25rem;}
        .title{font-family:'Playfair Display',Georgia,serif;font-size:1.9rem;font-weight:700;letter-spacing:-0.02em;}
        .sub{color:var(--muted);font-size:.9rem;margin-top:.25rem;}
        select,input,textarea{font-family:inherit;font-size:.9rem;color:var(--indigo);border:1.5px solid var(--line);border-radius:10px;padding:.6rem .8rem;background:white;outline:none;}
        select:focus,input:focus{border-color:var(--cacao);}
        .grid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:1.25rem;align-items:start;}
        @media(max-width:900px){.grid{grid-template-columns:1fr;}}
        .card{background:white;border:1px solid var(--line);border-radius:16px;padding:1.1rem 1.2rem;box-shadow:0 2px 10px rgba(26,43,76,.04);}
        .mnav{display:flex;align-items:center;justify-content:space-between;margin-bottom:.8rem;}
        .mnav h2{font-size:1.05rem;font-weight:700;text-transform:capitalize;margin:0;}
        .mbtn{width:34px;height:34px;border-radius:50%;border:1.5px solid var(--line);background:white;cursor:pointer;font-size:1rem;color:var(--indigo);}
        .mbtn:hover{border-color:var(--indigo);}
        .dow{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:6px;}
        .dow div{text-align:center;font-size:.7rem;font-weight:700;letter-spacing:.06em;color:var(--muted);text-transform:uppercase;}
        .cal{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;}
        .day{position:relative;min-height:70px;border-radius:10px;border:1.5px solid var(--line);background:white;padding:.4rem .45rem;cursor:pointer;text-align:left;font-family:inherit;color:var(--indigo);transition:border-color .12s, transform .12s;display:flex;flex-direction:column;justify-content:space-between;}
        .day:hover{border-color:rgba(230,126,34,.6);}
        .day.past{opacity:.45;cursor:default;}
        .day.sel{border-color:var(--cacao);box-shadow:0 0 0 2px rgba(230,126,34,.25) inset;}
        .day.partial{background:#FFF6EC;}
        .day.full{background:#1A2B4C;color:white;border-color:#1A2B4C;}
        .day.over{background:#FDECEC;border-color:#E25555;color:#B42318;}
        .dnum{font-size:.85rem;font-weight:700;}
        .dtop{display:flex;justify-content:space-between;align-items:center;gap:2px;}
        .dots{display:flex;gap:2px;}
        .dot{display:inline-block;width:7px;height:7px;border-radius:50%;flex-shrink:0;}
        .chip .dot{margin-right:.35rem;vertical-align:middle;}
        .tag .dot{margin-right:.3rem;vertical-align:middle;width:6px;height:6px;}
        .docc{font-size:.68rem;font-weight:600;opacity:.85;}
        .bar{height:4px;border-radius:4px;background:rgba(26,43,76,.08);overflow:hidden;margin-top:3px;}
        .bar i{display:block;height:100%;background:var(--cacao);}
        .full .bar{background:rgba(255,255,255,.25);} .full .bar i{background:white;}
        .legend{display:flex;gap:1rem;flex-wrap:wrap;margin-top:.8rem;font-size:.75rem;color:var(--muted);}
        .legend span{display:inline-flex;align-items:center;gap:.35rem;}
        .sw{width:12px;height:12px;border-radius:4px;border:1.5px solid var(--line);display:inline-block;}
        .h3{font-size:.95rem;font-weight:700;margin:0 0 .6rem;}
        .muted{color:var(--muted);font-size:.82rem;line-height:1.5;}
        .chips{display:flex;flex-wrap:wrap;gap:.4rem;margin:.4rem 0 .8rem;}
        .chip{padding:.38rem .7rem;border-radius:999px;border:1.5px solid var(--line);background:white;font-size:.8rem;font-weight:600;cursor:pointer;font-family:inherit;color:var(--indigo);}
        .chip.on{border-color:var(--cacao);background:#FFF3E4;color:var(--cacao-dark);}
        .stepper{display:inline-flex;align-items:center;border:1.5px solid var(--line);border-radius:10px;overflow:hidden;}
        .stepper button{width:34px;height:34px;border:none;background:white;font-size:1.05rem;cursor:pointer;color:var(--indigo);}
        .stepper span{min-width:34px;text-align:center;font-weight:700;}
        .btn{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;padding:.65rem 1.1rem;border-radius:999px;border:none;background:var(--cacao);color:white;font-weight:700;font-size:.86rem;cursor:pointer;font-family:inherit;}
        .btn:disabled{opacity:.5;cursor:not-allowed;}
        .btn.ghost{background:white;color:var(--indigo);border:1.5px solid var(--line);}
        .row{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;}
        .list{display:flex;flex-direction:column;gap:.45rem;}
        .li{display:flex;align-items:center;justify-content:space-between;gap:.6rem;padding:.55rem .7rem;border:1px solid var(--line);border-radius:10px;font-size:.82rem;}
        .tag{font-size:.68rem;font-weight:700;padding:.15rem .5rem;border-radius:999px;background:rgba(26,43,76,.07);color:var(--indigo);white-space:nowrap;display:inline-flex;align-items:center;}
        .tag.reserve{background:#FFF3E4;color:var(--cacao-dark);}
        .x{border:none;background:none;color:var(--muted);cursor:pointer;font-size:.8rem;text-decoration:underline;font-family:inherit;}
        .alert{background:#FDECEC;border:1px solid #F5B5B5;color:#B42318;border-radius:12px;padding:.8rem 1rem;font-size:.86rem;margin-bottom:1rem;line-height:1.5;}
        .err{color:#B42318;font-size:.82rem;margin-top:.5rem;}
        .ok{color:#067647;font-size:.82rem;margin-top:.5rem;}
        .copy{display:flex;gap:.4rem;}
        .copy input{flex:1;min-width:0;font-size:.75rem;color:var(--muted);}
        details summary{cursor:pointer;font-size:.82rem;font-weight:600;color:var(--cacao-dark);}
        .help li{margin:.3rem 0;}
        @media(max-width:560px){.day{min-height:56px;padding:.3rem;}.docc{font-size:.6rem;}.title{font-size:1.5rem;}}
      `}</style>
      <DashboardNav />
      <div className="wrap">
        <div className="head">
          <div>
            <div className="title">Calendario</div>
            <div className="sub">Anota aquí las reservas que recibes por WhatsApp, teléfono u otras plataformas para no vender la misma habitación dos veces.</div>
          </div>
          {data && data.posadas.length > 1 && (
            <select value={data.posada?.slug ?? ''} onChange={e => router.push(`/dashboard/calendario?posada=${e.target.value}`)}>
              {data.posadas.map(p => <option key={p.slug} value={p.slug}>{p.nombre}{p.isDemo ? ' · demo' : ''}{p.status !== 'active' ? ` · ${p.status === 'pending_review' ? 'en revisión' : p.status}` : ''}</option>)}
            </select>
          )}
        </div>

        {loading && !data && <div className="card muted">Cargando calendario…</div>}
        {!loading && !data?.posada && (
          <div className="card">
            <div className="h3">Aún no tienes posadas</div>
            <p className="muted">Publica tu posada para usar el calendario.</p>
            <a href="/dashboard/posada/nueva" className="btn" style={{ textDecoration: 'none', marginTop: '.6rem' }}>Publicar mi posada</a>
          </div>
        )}

        {data?.posada && (
          <>
            {data.isAdmin && (
              <div className="alert" style={{ background: '#EEF2F8', borderColor: '#C9D3E3', color: '#1A2B4C' }}>
                Vista de administrador: calendario de <strong>{data.posada.nombre}</strong>{data.posada.isDemo ? ' (posada demo)' : ''}. Los cambios que hagas aquí los verá el posadero.
              </div>
            )}
            {overbooked.length > 0 && (
              <div className="alert">
                <strong>Sobreventa:</strong> tienes más reservas que habitaciones el {overbooked.map(d => fmt(d.date)).join(', ')}. Revisa esas fechas y cancela o reubica lo que sobre.
              </div>
            )}
            <div className="grid">
              <div className="card">
                <div className="mnav">
                  <button className="mbtn" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Mes anterior">‹</button>
                  <h2>{MONTHS[m - 1]} {y} · {data.posada.nombre}</h2>
                  <button className="mbtn" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Mes siguiente">›</button>
                </div>
                <div className="dow">{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => <div key={d}>{d}</div>)}</div>
                <div className="cal">
                  {cells.map((d, i) => {
                    if (!d) return <div key={i} />
                    const used = usedMap.get(d) ?? 0
                    const past = d < today
                    const cls = used > total ? 'over' : used >= total ? 'full' : used > 0 ? 'partial' : ''
                    return (
                      <button key={d} className={`day ${cls}${past ? ' past' : ''}${inSel(d) ? ' sel' : ''}`} disabled={past} onClick={() => clickDay(d)}>
                        <span className="dtop"><span className="dnum">{Number(d.slice(8))}</span><span className="dots">{[...(daySources.get(d) ?? [])].slice(0, 4).map(src => <i key={src} className="dot" style={{ background: channel(src).color }} />)}</span></span>
                        <span>
                          <span className="docc">{used > total ? `${used}/${total} ⚠` : used >= total ? 'Lleno' : `${total - used} libre${total - used === 1 ? '' : 's'}`}</span>
                          <div className="bar"><i style={{ width: `${Math.min(100, (used / total) * 100)}%` }} /></div>
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div className="legend">
                  <span><i className="sw" /> Libre</span>
                  <span><i className="sw" style={{ background: '#FFF6EC' }} /> Algunas ocupadas</span>
                  <span><i className="sw" style={{ background: '#1A2B4C', borderColor: '#1A2B4C' }} /> Lleno</span>
                  <span><i className="sw" style={{ background: '#FDECEC', borderColor: '#E25555' }} /> Sobreventa</span>
                  <span>{data.posada.habitaciones} habitaciones en total</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="card">
                  <div className="h3">Anotar una reserva externa</div>
                  {!selStart ? (
                    <p className="muted">Toca el día de llegada y luego la última noche en el calendario.</p>
                  ) : (
                    <>
                      <p className="muted" style={{ marginBottom: '.6rem' }}>
                        Del <strong>{fmt(selStart)}</strong> al <strong>{fmt(addDays(lastNight!, 1))}</strong> (salida) · {Math.round((Date.parse(addDays(lastNight!, 1)) - Date.parse(selStart)) / 86400000)} noche(s){!selEnd && ' · toca la última noche si son varias'}
                      </p>
                      <div className="muted">Origen</div>
                      <div className="chips">
                        {SOURCES.map(c => (
                          <button key={c.key} className={`chip${source === c.key ? ' on' : ''}`} onClick={() => setSource(c.key)}>
                            <i className="dot" style={{ background: c.color }} />{c.key === 'cerrado' ? 'Cerrar posada' : c.label}
                          </button>
                        ))}
                      </div>
                      {source !== 'cerrado' && (
                        <div className="row" style={{ marginBottom: '.7rem' }}>
                          <span className="muted">Habitaciones</span>
                          <div className="stepper">
                            <button onClick={() => setRooms(r => Math.max(1, r - 1))}>−</button>
                            <span>{rooms}</span>
                            <button onClick={() => setRooms(r => Math.min(total, r + 1))}>+</button>
                          </div>
                        </div>
                      )}
                      <input placeholder="Nota (opcional): nombre del huésped, etc." value={note} onChange={e => setNote(e.target.value)} style={{ width: '100%', marginBottom: '.7rem' }} maxLength={120} />
                      <div className="row">
                        <button className="btn" onClick={saveBlock} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
                        <button className="btn ghost" onClick={() => { setSelStart(null); setSelEnd(null) }}>Cancelar</button>
                      </div>
                      {msg && <div className="err">{msg}</div>}
                    </>
                  )}
                </div>

                {summary.length > 0 && (
                  <div className="card">
                    <div className="h3">De dónde vienen tus reservas este mes</div>
                    <div className="list">
                      {summary.map(([src, n]) => {
                        const max = summary[0][1]
                        return (
                          <div key={src} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 78px', alignItems: 'center', gap: '.5rem', fontSize: '.8rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}><i className="dot" style={{ background: channel(src).color }} />{channel(src).label}</span>
                            <span className="bar" style={{ height: 6, marginTop: 0 }}><i style={{ width: `${(n / max) * 100}%`, background: channel(src).color }} /></span>
                            <span className="muted" style={{ textAlign: 'right' }}>{n} noche{n === 1 ? '' : 's'}</span>
                          </div>
                        )
                      })}
                    </div>
                    <p className="muted" style={{ fontSize: '.72rem', marginTop: '.5rem' }}>Noches-habitación ocupadas por canal.</p>
                  </div>
                )}

                <div className="card">
                  <div className="h3">Este mes</div>
                  {monthItems.length === 0 ? <p className="muted">No hay reservas ni ocupación este mes.</p> : (
                    <div className="list">
                      {monthItems.map(it => (
                        <div key={`${it.kind}-${it.id}`} className="li">
                          <div>
                            <div style={{ fontWeight: 600 }}>{fmt(it.start)} → {fmt(it.end)} · {it.rooms} hab.</div>
                            {it.label && <div className="muted" style={{ fontSize: '.75rem' }}>{it.label}</div>}
                          </div>
                          <div className="row">
                            <span className="tag" style={{ background: channel(it.kind === 'booking' ? 'reserve' : it.source).color + '1A', color: channel(it.kind === 'booking' ? 'reserve' : it.source).color }}>
                              <i className="dot" style={{ background: channel(it.kind === 'booking' ? 'reserve' : it.source).color }} />
                              {it.kind === 'booking' ? `RESER-VE${it.status === 'pending' ? ' · pendiente' : ''}` : channel(it.source).label}{it.synced ? ' · sinc.' : ''}
                            </span>
                            {it.kind === 'block' && !it.synced && <button className="x" onClick={() => removeBlock(it.id)}>Quitar</button>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card" style={{ marginTop: '1.25rem' }}>
              <div className="h3">Sincronizar con Booking, Airbnb o Google Calendar</div>
              <p className="muted">Conecta tus calendarios para que las reservas se bloqueen solas en ambos lados. Se actualizan automáticamente; también puedes forzarlo con “Sincronizar ahora”.</p>
              <div className="grid" style={{ marginTop: '1rem', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.86rem', marginBottom: '.3rem' }}>1. Lleva RESER-VE a tus otras plataformas</div>
                  <p className="muted" style={{ marginBottom: '.5rem' }}>Copia este enlace y pégalo en Booking, Airbnb o Google Calendar como “calendario importado”.</p>
                  <div className="copy">
                    <input readOnly value={data.exportUrl} onFocus={e => e.target.select()} />
                    <button className="btn ghost" onClick={() => { navigator.clipboard.writeText(data.exportUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>{copied ? 'Copiado' : 'Copiar'}</button>
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.86rem', marginBottom: '.3rem' }}>2. Trae tus reservas de otras plataformas</div>
                  <div className="row" style={{ marginBottom: '.5rem' }}>
                    <select value={feedSource} onChange={e => setFeedSource(e.target.value)}>
                      {FEED_SOURCES.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                    </select>
                    <span className="muted">bloquea</span>
                    <div className="stepper">
                      <button onClick={() => setFeedRooms(r => Math.max(1, r - 1))}>−</button>
                      <span>{feedRooms}</span>
                      <button onClick={() => setFeedRooms(r => Math.min(total, r + 1))}>+</button>
                    </div>
                    <span className="muted">hab. por reserva</span>
                  </div>
                  <div className="copy">
                    <input placeholder="Pega aquí el enlace iCal (https://…)" value={feedUrl} onChange={e => setFeedUrl(e.target.value)} />
                    <button className="btn" onClick={addFeed} disabled={feedBusy || !feedUrl.trim()}>{feedBusy ? '…' : 'Conectar'}</button>
                  </div>
                </div>
              </div>

              {data.feeds.length > 0 && (
                <div className="list" style={{ marginTop: '1rem' }}>
                  {data.feeds.map(f => (
                    <div key={f.id} className="li">
                      <div>
                        <div style={{ fontWeight: 600 }}>{f.name} · {f.rooms} hab. por reserva</div>
                        <div className="muted" style={{ fontSize: '.75rem' }}>{f.lastStatus ?? 'Pendiente'}{f.lastSyncAt ? ` · ${new Date(f.lastSyncAt).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' })}` : ''}</div>
                      </div>
                      <button className="x" onClick={() => removeFeed(f.id)}>Desconectar</button>
                    </div>
                  ))}
                  <div><button className="btn ghost" onClick={syncNow} disabled={feedBusy}>{feedBusy ? 'Sincronizando…' : 'Sincronizar ahora'}</button></div>
                </div>
              )}
              {feedMsg && <div className={feedMsg.startsWith('No') ? 'err' : 'ok'}>{feedMsg}</div>}

              <details style={{ marginTop: '1rem' }} open={showHelp} onToggle={e => setShowHelp((e.target as HTMLDetailsElement).open)}>
                <summary>¿Dónde encuentro el enlace iCal?</summary>
                <ul className="muted help" style={{ paddingLeft: '1.1rem' }}>
                  <li><strong>Booking:</strong> Extranet → Tarifas y disponibilidad → Sincronizar calendarios → Exportar calendario. Para importar, ahí mismo pega el enlace de RESER-VE.</li>
                  <li><strong>Airbnb:</strong> Calendario → Disponibilidad → Conectar calendarios → Exportar calendario. Para importar, “Importar calendario” y pega el enlace de RESER-VE.</li>
                  <li><strong>Google Calendar:</strong> Configuración del calendario → “Dirección secreta en formato iCal”. Para ver RESER-VE en Google: Otros calendarios → Desde URL.</li>
                </ul>
              </details>
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default function CalendarioPage() {
  return <Suspense><CalendarioInner /></Suspense>
}
