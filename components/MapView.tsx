'use client'

import { useEffect, useRef } from 'react'
import type { Posada } from '@/lib/data'
import type { SearchResult } from '@/lib/search'
import { useT } from './LangProvider'

// Mapa vectorial con MapLibre GL + OpenFreeMap (estilo "Positron", minimalista), recoloreado
// con la paleta de RESER-VE: arena, índigo y cacao. Sin API key.
const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'

const SAND = '#F5EFE3', INDIGO = '#1A2B4C'
// Colores por id de capa (propiedad → valor). Lo no listado conserva el estilo base.
const THEME: Record<string, Record<string, unknown>> = {
  background:              { 'background-color': SAND },
  park:                    { 'fill-color': '#E4E6D0' },
  landcover_wood:          { 'fill-color': '#DFE3CB' },
  landuse_residential:     { 'fill-color': '#EEE6D6' },
  water:                   { 'fill-color': '#A9D2DE' },
  waterway:                { 'line-color': '#A6C8D4' },
  building:                { 'fill-color': '#EAE0CF', 'fill-outline-color': '#E0D4BF' },
  road_area_pier:          { 'fill-color': SAND },
  road_pier:               { 'line-color': SAND },
  highway_minor:           { 'line-color': '#E9DFCD' },
  highway_path:            { 'line-color': '#ECE3D3' },
  highway_major_casing:    { 'line-color': '#E2D5BF' },
  highway_major_inner:     { 'line-color': '#FFFDF8' },
  highway_major_subtle:    { 'line-color': 'rgba(196,176,146,0.35)' },
  highway_motorway_casing: { 'line-color': '#E9C9A2' },
  highway_motorway_inner:  { 'line-color': '#FBE6CC' },
  highway_motorway_subtle: { 'line-color': 'rgba(201,101,16,0.2)' },
  highway_motorway_bridge_casing: { 'line-color': '#E9C9A2' },
  highway_motorway_bridge_inner:  { 'line-color': '#FBE6CC' },
  boundary_2:              { 'line-color': 'rgba(201,101,16,0.45)' },
  boundary_3:              { 'line-color': 'rgba(26,43,76,0.18)' },
  boundary_disputed:       { 'line-color': 'rgba(201,101,16,0.35)' },
  water_name_point_label:  { 'text-color': '#3F6F82', 'text-halo-color': 'rgba(169,210,222,0.6)' },
  water_name_line_label:   { 'text-color': '#4E7C8E', 'text-halo-color': 'rgba(183,212,222,0.6)' },
  waterway_line_label:     { 'text-color': '#6F97A5', 'text-halo-color': SAND },
  'highway-name-minor':    { 'text-color': '#9A8D78', 'text-halo-color': SAND },
  'highway-name-major':    { 'text-color': '#8A7C66', 'text-halo-color': SAND },
  'highway-name-path':     { 'text-color': '#A89C88', 'text-halo-color': SAND },
  airport:                 { 'text-color': '#8A7C66', 'text-halo-color': SAND },
  label_other:             { 'text-color': '#8A7C66', 'text-halo-color': SAND },
  label_village:           { 'text-color': '#5A6478', 'text-halo-color': SAND },
  label_town:              { 'text-color': '#3C4A63', 'text-halo-color': SAND },
  label_state:             { 'text-color': '#A08A70', 'text-halo-color': SAND },
  label_city:              { 'text-color': INDIGO, 'text-halo-color': SAND },
  label_city_capital:      { 'text-color': INDIGO, 'text-halo-color': SAND },
  label_country_1:         { 'text-color': INDIGO, 'text-halo-color': SAND },
  label_country_2:         { 'text-color': INDIGO, 'text-halo-color': SAND },
  label_country_3:         { 'text-color': INDIGO, 'text-halo-color': SAND },
}

// Aplica THEME al JSON del estilo antes de pintarlo (sin parpadeo de colores).
function themed(style: any) {
  return {
    ...style,
    layers: style.layers.map((l: any) => THEME[l.id] ? { ...l, paint: { ...(l.paint ?? {}), ...THEME[l.id] } } : l),
  }
}

type Props = {
  results: SearchResult[]
  allPosadas: Posada[]
  searchKey: string
  mobileVisible?: boolean         // true when the mobile Mapa tab is active
  hoveredSlug: string | null
  onHover: (slug: string | null) => void
  onSelect: (slug: string) => void
  onViewportChange?: (slugsInView: string[]) => void
  onUserPan?: () => void
}

type MarkerEntry = { marker: any; pill: HTMLDivElement; posada: Posada }

export default function MapView({
  results, allPosadas, searchKey, mobileVisible,
  hoveredSlug, onHover, onSelect,
  onViewportChange, onUserPan,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const t = useT()
  const tRef = useRef(t)
  tRef.current = t
  const mapRef       = useRef<any>(null)
  const libRef       = useRef<any>(null)
  const markersRef   = useRef<Map<string, MarkerEntry>>(new Map())
  const popupRef     = useRef<any>(null)
  const userHasPannedRef = useRef(false)

  // Refs siempre frescas (el init es asíncrono)
  const resultsRef          = useRef(results)
  const allPosadasRef       = useRef(allPosadas)
  const onViewportChangeRef = useRef(onViewportChange)
  const onUserPanRef        = useRef(onUserPan)
  const onHoverRef          = useRef(onHover)
  const onSelectRef         = useRef(onSelect)
  useEffect(() => { resultsRef.current = results }, [results])
  useEffect(() => { allPosadasRef.current = allPosadas }, [allPosadas])
  useEffect(() => { onViewportChangeRef.current = onViewportChange }, [onViewportChange])
  useEffect(() => { onUserPanRef.current = onUserPan }, [onUserPan])
  useEffect(() => { onHoverRef.current = onHover }, [onHover])
  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])

  // Nueva búsqueda → vuelve a encuadrar
  useEffect(() => { userHasPannedRef.current = false }, [searchKey])

  // Pestaña "Mapa" en móvil: el contenedor estaba oculto → recalcular tamaño
  useEffect(() => {
    if (!mobileVisible || !mapRef.current) return
    requestAnimationFrame(() => {
      mapRef.current?.resize()
      if (!userHasPannedRef.current) fitTo(currentTargets())
    })
  }, [mobileVisible]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Init (una vez) ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false

    // Descarga el estilo base y lo recolorea antes de crear el mapa (sin parpadeo).
    const styleP = fetch(STYLE_URL).then(r => r.json()).then(themed).catch(() => STYLE_URL)
    Promise.all([import('maplibre-gl'), styleP]).then(([lib, style]) => {
      if (cancelled || !containerRef.current) return
      // Worker servido desde /public (copiado en postinstall) — ver scripts/copy-maplibre-worker.mjs
      lib.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs')
      libRef.current = lib
      const map = new lib.Map({
        container: containerRef.current,
        style,
        center: [-66.5, 8.0],
        zoom: 5,
        maxZoom: 17,
        attributionControl: { compact: true },
        cooperativeGestures: false,
      })
      mapRef.current = map
      // Zoom arriba-derecha: no choca con el botón del asistente (abajo-derecha)
      map.addControl(new lib.NavigationControl({ showCompass: false }), 'top-right')
      map.dragRotate.disable()
      map.touchZoomRotate.disableRotation()

      map.on('dragstart', (e: any) => {
        if (e.originalEvent) { userHasPannedRef.current = true; onUserPanRef.current?.() }
      })
      map.on('moveend', () => {
        const cb = onViewportChangeRef.current
        if (!cb) return
        const b = map.getBounds()
        const visible: string[] = []
        markersRef.current.forEach((m, slug) => { if (b.contains([m.posada.lng, m.posada.lat])) visible.push(slug) })
        cb(visible)
      })

      rebuildMarkers()
    })

    return () => {
      cancelled = true
      popupRef.current?.remove()
      markersRef.current.forEach(m => m.marker.remove())
      markersRef.current.clear()
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Resultados cambian → reconstruir marcadores
  useEffect(() => { if (mapRef.current) rebuildMarkers() }, [results, allPosadas]) // eslint-disable-line react-hooks/exhaustive-deps

  // Resaltado al pasar el cursor por una tarjeta de la lista
  useEffect(() => {
    markersRef.current.forEach((m, slug) => {
      const on = slug === hoveredSlug
      m.pill.classList.toggle('mkr-hov', on)
      const el = m.marker.getElement() as HTMLElement
      el.style.zIndex = on ? '1000' : (m.pill.classList.contains('ghost') ? '1' : '5')
    })
  }, [hoveredSlug])

  // ── Helpers ────────────────────────────────────────────────────────────────
  function currentTargets(): Posada[] {
    return resultsRef.current.length > 0 ? resultsRef.current.map(r => r.posada) : allPosadasRef.current
  }

  function fitTo(posadas: Posada[]) {
    const map = mapRef.current, lib = libRef.current
    if (!map || !lib || posadas.length === 0) return
    if (posadas.length === 1) {
      map.flyTo({ center: [posadas[0].lng, posadas[0].lat], zoom: 11, duration: 700 })
      return
    }
    const bounds = new lib.LngLatBounds()
    posadas.forEach(p => bounds.extend([p.lng, p.lat]))
    map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 700 })
  }

  function showPopup(p: Posada) {
    const map = mapRef.current, lib = libRef.current
    if (!map || !lib) return
    popupRef.current?.remove()
    const safe = (s: string) => s.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!))
    popupRef.current = new lib.Popup({ closeButton: false, closeOnClick: false, offset: 18, className: 'mkr-tip' })
      .setLngLat([p.lng, p.lat])
      .setHTML(`<div class="mkr-tip-name">${safe(p.nombre)}</div><div class="mkr-tip-meta">${safe(p.destino)} · $${p.precio}${tRef.current('/noche')}</div>`)
      .addTo(map)
  }

  function rebuildMarkers() {
    const map = mapRef.current, lib = libRef.current
    if (!map || !lib) return
    markersRef.current.forEach(m => m.marker.remove())
    markersRef.current.clear()

    const res = resultsRef.current
    const resultSlugs = new Set(res.map(r => r.posada.slug))
    const add = (posada: Posada, variant: 'active' | 'proximity' | 'ghost') => {
      // El elemento raíz lo posiciona MapLibre (transform); la pastilla es un hijo
      // para poder escalarla sin romper la posición.
      const root = document.createElement('div')
      root.style.cursor = 'pointer'
      root.style.zIndex = variant === 'ghost' ? '1' : '5'
      const pill = document.createElement('div')
      pill.className = variant === 'ghost' ? 'mkr ghost' : variant === 'proximity' ? 'mkr proximity' : 'mkr'
      pill.textContent = `$${posada.precio}`
      root.appendChild(pill)

      root.addEventListener('mouseenter', () => { onHoverRef.current(posada.slug); showPopup(posada) })
      root.addEventListener('mouseleave', () => { onHoverRef.current(null); popupRef.current?.remove() })
      root.addEventListener('click', e => { e.stopPropagation(); popupRef.current?.remove(); onSelectRef.current(posada.slug) })

      const marker = new lib.Marker({ element: root, anchor: 'center' }).setLngLat([posada.lng, posada.lat]).addTo(map)
      markersRef.current.set(posada.slug, { marker, pill, posada })
    }

    allPosadasRef.current.forEach(p => { if (!resultSlugs.has(p.slug)) add(p, 'ghost') })
    res.forEach(({ posada, isProximity }) => add(posada, isProximity ? 'proximity' : 'active'))

    if (!userHasPannedRef.current) fitTo(currentTargets())
  }

  return (
    <>
      <style>{`
        .mkr {
          display: inline-flex; align-items: center; justify-content: center;
          background: #FFFDF8; color: #1A2B4C;
          font-family: 'Inter', system-ui, sans-serif; font-size: 13px; font-weight: 800;
          padding: 6px 12px; border-radius: 999px;
          box-shadow: 0 2px 10px rgba(26,43,76,0.22), 0 0 0 1px rgba(26,43,76,0.08);
          white-space: nowrap; user-select: none;
          transition: transform .15s ease, background .15s ease, color .15s ease, box-shadow .15s ease;
        }
        .mkr:hover, .mkr.mkr-hov {
          background: #E67E22; color: #fff; transform: scale(1.12);
          box-shadow: 0 6px 18px rgba(230,126,34,0.4);
        }
        .mkr.ghost { background: rgba(255,253,248,0.75); color: #8A7C66; font-size: 11px; padding: 4px 9px; font-weight: 700; box-shadow: 0 1px 4px rgba(26,43,76,0.12); }
        .mkr.proximity { background: #FFF3E4; color: #C96510; }
        .mkr-tip .maplibregl-popup-content {
          background: #1A2B4C; color: #fff; border-radius: 12px; padding: 8px 12px;
          box-shadow: 0 8px 24px rgba(26,43,76,0.35); font-family: 'Inter', system-ui, sans-serif;
        }
        .mkr-tip.maplibregl-popup-anchor-bottom .maplibregl-popup-tip { border-top-color: #1A2B4C; }
        .mkr-tip.maplibregl-popup-anchor-top .maplibregl-popup-tip { border-bottom-color: #1A2B4C; }
        .mkr-tip-name { font-size: 13px; font-weight: 800; }
        .mkr-tip-meta { font-size: 11px; opacity: .8; margin-top: 2px; }
        .maplibregl-ctrl-group { border-radius: 10px !important; overflow: hidden; box-shadow: 0 2px 10px rgba(26,43,76,.15) !important; }
      `}</style>
      <div ref={containerRef} style={{ width: '100%', height: '100%', borderRadius: 'inherit', overflow: 'hidden', background: SAND }} />
    </>
  )
}
