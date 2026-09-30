'use client'

import { useEffect, useRef } from 'react'
import type { Posada } from '@/lib/data'
import type { SearchResult } from '@/lib/search'

// Mapa vectorial con MapLibre GL + OpenFreeMap (estilo "Liberty"): nítido, colorido,
// rápido y sin API key. Misma interfaz que el mapa anterior.
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

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

    import('maplibre-gl').then(lib => {
      if (cancelled || !containerRef.current) return
      // Worker servido desde /public (copiado en postinstall) — ver scripts/copy-maplibre-worker.mjs
      lib.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs')
      libRef.current = lib
      const map = new lib.Map({
        container: containerRef.current,
        style: STYLE_URL,
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
      .setHTML(`<div class="mkr-tip-name">${safe(p.nombre)}</div><div class="mkr-tip-meta">${safe(p.destino)} · $${p.precio}/noche</div>`)
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
          background: #fff; color: #1A2B4C;
          font-family: 'Inter', system-ui, sans-serif; font-size: 13px; font-weight: 800;
          padding: 6px 12px; border-radius: 999px;
          box-shadow: 0 2px 10px rgba(26,43,76,0.22), 0 0 0 1px rgba(26,43,76,0.08);
          white-space: nowrap; user-select: none;
          transition: transform .15s ease, background .15s ease, color .15s ease, box-shadow .15s ease;
        }
        .mkr:hover, .mkr.mkr-hov {
          background: #1A2B4C; color: #fff; transform: scale(1.12);
          box-shadow: 0 6px 18px rgba(26,43,76,0.35);
        }
        .mkr.ghost { background: rgba(255,255,255,0.8); color: #7A8699; font-size: 11px; padding: 4px 9px; font-weight: 700; }
        .mkr.proximity { background: #F5EFE0; }
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
      <div ref={containerRef} style={{ width: '100%', height: '100%', borderRadius: 'inherit', overflow: 'hidden' }} />
    </>
  )
}
