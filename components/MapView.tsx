'use client'

import { useEffect, useRef } from 'react'
import type { Posada } from '@/lib/data'
import type { SearchResult } from '@/lib/search'

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

export default function MapView({
  results, allPosadas, searchKey, mobileVisible,
  hoveredSlug, onHover, onSelect,
  onViewportChange, onUserPan,
}: Props) {
  const containerRef        = useRef<HTMLDivElement>(null)
  const mapRef              = useRef<any>(null)
  const markersRef          = useRef<Map<string, any>>(new Map())
  const LRef                = useRef<any>(null)
  const userHasPannedRef    = useRef(false)
  const programmaticRef     = useRef(false)

  // Always-fresh refs — avoids stale closure in async Leaflet init
  const resultsRef          = useRef(results)
  const allPosadasRef       = useRef(allPosadas)
  const onViewportChangeRef = useRef(onViewportChange)
  const onUserPanRef        = useRef(onUserPan)

  useEffect(() => { resultsRef.current    = results },          [results])
  useEffect(() => { allPosadasRef.current = allPosadas },       [allPosadas])
  useEffect(() => { onViewportChangeRef.current = onViewportChange }, [onViewportChange])
  useEffect(() => { onUserPanRef.current  = onUserPan },        [onUserPan])

  // Reset pan-lock whenever a brand-new search fires
  useEffect(() => { userHasPannedRef.current = false }, [searchKey])

  // When the mobile Mapa tab becomes visible, Leaflet's container was hidden
  // (display:none → fixed). Force a size recalculation and re-fit.
  useEffect(() => {
    if (!mobileVisible) return
    const map = mapRef.current
    if (!map) return
    // rAF ensures the CSS transition has committed before measuring
    requestAnimationFrame(() => {
      map.invalidateSize({ animate: false })
      // Re-fit so tiles cover the new full-screen size
      const L = LRef.current
      if (!L) return
      const targets = resultsRef.current.length > 0
        ? resultsRef.current.map(r => r.posada)
        : allPosadasRef.current
      if (targets.length > 0 && !userHasPannedRef.current) {
        fitBounds(L, map, targets)
      }
    })
  }, [mobileVisible]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Init map once ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    import('leaflet').then(L => {
      if (!containerRef.current) return  // unmounted while loading
      LRef.current = L
      delete (L.Icon.Default.prototype as any)._getIconUrl

      const map = L.map(containerRef.current, {
        center: [8.0, -66.5],
        zoom: 6,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true,
        touchZoom: true,
        bounceAtZoomLimits: false,
      })
      mapRef.current = map

      // CartoDB Positron — minimal, matches brand palette
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        { subdomains: 'abcd', maxZoom: 20 }
      ).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)
      L.control.attribution({
        position: 'bottomleft',
        prefix: '<a href="https://www.openstreetmap.org/copyright" target="_blank">OSM</a> · <a href="https://carto.com" target="_blank">CARTO</a>',
      }).addTo(map)

      map.on('dragstart', () => {
        if (!programmaticRef.current) {
          userHasPannedRef.current = true
          onUserPanRef.current?.()
        }
      })

      map.on('moveend zoomend', () => {
        if (!onViewportChangeRef.current) return
        const bounds = map.getBounds()
        const visible: string[] = []
        markersRef.current.forEach((marker, slug) => {
          if (bounds.contains(marker.getLatLng())) visible.push(slug)
        })
        onViewportChangeRef.current(visible)
      })

      // ── CRITICAL: build markers immediately after Leaflet is ready ──────
      // The [results, allPosadas] effect fires before Leaflet loads (async),
      // finds LRef=null and exits. Build here with the current values from refs.
      rebuildMarkers(L, map, resultsRef.current, allPosadasRef.current)
    })

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markersRef.current.clear() }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-build markers when results change (Leaflet already ready) ─────────
  useEffect(() => {
    const L   = LRef.current
    const map = mapRef.current
    if (!L || !map) return  // Not ready yet — handled in init callback above
    rebuildMarkers(L, map, results, allPosadas)
  }, [results, allPosadas]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Hover highlight ───────────────────────────────────────────────────────
  useEffect(() => {
    markersRef.current.forEach((marker, slug) => {
      const el    = marker.getElement()
      const inner = el?.querySelector('.mkr') as HTMLElement | null
      if (!inner) return
      if (slug === hoveredSlug) {
        inner.classList.add('mkr-hov'); marker.setZIndexOffset(1000)
      } else {
        inner.classList.remove('mkr-hov'); marker.setZIndexOffset(0)
      }
    })
  }, [hoveredSlug])

  // ── Helpers ───────────────────────────────────────────────────────────────
  function rebuildMarkers(L: any, map: any, res: SearchResult[], all: Posada[]) {
    markersRef.current.forEach(m => m.remove())
    markersRef.current.clear()

    const resultSlugs = new Set(res.map(r => r.posada.slug))

    // Ghost markers for posadas not in current results
    all.forEach(posada => {
      if (resultSlugs.has(posada.slug)) return
      const m = addMarker(L, map, posada, 'ghost')
      markersRef.current.set(posada.slug, m)
    })

    // Active markers on top
    res.forEach(({ posada, isProximity }) => {
      const m = addMarker(L, map, posada, isProximity ? 'proximity' : 'active')
      markersRef.current.set(posada.slug, m)
    })

    // Fit bounds — only if user hasn't manually panned
    if (!userHasPannedRef.current) {
      const targets = res.length > 0 ? res.map(r => r.posada) : all
      if (targets.length > 0) {
        programmaticRef.current = true
        fitBounds(L, map, targets)
        setTimeout(() => { programmaticRef.current = false }, 1000)
      }
    }
  }

  function addMarker(L: any, map: any, posada: Posada, variant: 'active' | 'proximity' | 'ghost') {
    const cls = variant === 'ghost' ? 'mkr ghost'
              : variant === 'proximity' ? 'mkr proximity'
              : 'mkr'

    const icon = L.divIcon({
      className: '',
      html: `<div class="${cls}">$${posada.precio}</div>`,
      iconSize:   [1, 1],
      iconAnchor: [0, 0],
    })

    const marker = L.marker([posada.lat, posada.lng], {
      icon,
      zIndexOffset: variant === 'ghost' ? 0 : 500,
      interactive: true,
      bubblingMouseEvents: false,
    }).addTo(map)

    marker.on('mouseover', () => onHover(posada.slug))
    marker.on('mouseout',  () => onHover(null))
    marker.on('click',     () => onSelect(posada.slug))

    return marker
  }

  return (
    <>
      <style>{`
        .mkr {
          position: absolute;
          left: 0; top: 0;
          transform: translate(-50%, -50%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #1A2B4C;
          color: white;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 12px;
          font-weight: 700;
          padding: 5px 11px;
          border-radius: 999px;
          border: 2.5px solid white;
          box-shadow: 0 2px 10px rgba(26,43,76,0.28);
          white-space: nowrap;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
          pointer-events: all;
          user-select: none;
        }
        .mkr.ghost {
          background: rgba(100,115,135,0.50);
          border-color: rgba(255,255,255,0.85);
          font-size: 11px;
          padding: 4px 9px;
          box-shadow: 0 1px 5px rgba(0,0,0,0.12);
        }
        .mkr.proximity { background: #7A8699; }
        .mkr.mkr-hov {
          background: #E67E22 !important;
          transform: translate(-50%, -50%) scale(1.2) !important;
          box-shadow: 0 5px 18px rgba(230,126,34,0.50) !important;
        }
        .leaflet-control-zoom a {
          border-radius: 8px !important;
          color: #1A2B4C !important;
          font-weight: 600 !important;
        }
        .leaflet-control-attribution {
          font-size: 9px !important;
          background: rgba(255,255,255,0.75) !important;
          backdrop-filter: blur(4px);
        }
      `}</style>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 'inherit',
          touchAction: 'none',   // let Leaflet handle all touch events, no browser scroll interference
        }}
      />
    </>
  )
}

function fitBounds(L: any, map: any, posadas: Posada[]) {
  if (posadas.length === 0) return
  if (posadas.length === 1) {
    map.setView([posadas[0].lat, posadas[0].lng], 11, { animate: true })
    return
  }
  const bounds = L.latLngBounds(posadas.map(p => [p.lat, p.lng]))
  map.fitBounds(bounds, { padding: [56, 56], maxZoom: 12, animate: true })
}
