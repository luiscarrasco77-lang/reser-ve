'use client'

import { useEffect, useRef } from 'react'
import type { Posada } from '@/lib/data'
import type { SearchResult } from '@/lib/search'

type Props = {
  results: SearchResult[]
  allPosadas: Posada[]
  searchKey: string               // changes only when user issues a new search
  hoveredSlug: string | null
  onHover: (slug: string | null) => void
  onSelect: (slug: string) => void
  onViewportChange?: (slugsInView: string[]) => void
  onUserPan?: () => void
}

export default function MapView({
  results, allPosadas, searchKey,
  hoveredSlug, onHover, onSelect,
  onViewportChange, onUserPan,
}: Props) {
  const containerRef        = useRef<HTMLDivElement>(null)
  const mapRef              = useRef<any>(null)
  const markersRef          = useRef<Map<string, any>>(new Map())
  const LRef                = useRef<any>(null)
  const userHasPannedRef    = useRef(false)   // true after a manual pan — suppresses fitBounds
  const programmaticRef     = useRef(false)   // true during fitBounds — suppresses onUserPan
  const onViewportChangeRef = useRef(onViewportChange)
  const onUserPanRef        = useRef(onUserPan)

  useEffect(() => { onViewportChangeRef.current = onViewportChange }, [onViewportChange])
  useEffect(() => { onUserPanRef.current = onUserPan }, [onUserPan])

  // When a new search is issued, allow fitBounds again
  useEffect(() => {
    userHasPannedRef.current = false
  }, [searchKey])

  // ── Init map once ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    import('leaflet').then(L => {
      LRef.current = L
      delete (L.Icon.Default.prototype as any)._getIconUrl

      const map = L.map(containerRef.current!, {
        center: [8.0, -66.5],
        zoom: 6,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true,
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

      function emitVisible() {
        if (!onViewportChangeRef.current) return
        const bounds = map.getBounds()
        const visible: string[] = []
        markersRef.current.forEach((marker, slug) => {
          if (bounds.contains(marker.getLatLng())) visible.push(slug)
        })
        onViewportChangeRef.current(visible)
      }

      map.on('dragstart', () => {
        if (!programmaticRef.current) {
          userHasPannedRef.current = true
          onUserPanRef.current?.()
        }
      })
      map.on('moveend zoomend', emitVisible)
    })

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markersRef.current.clear() }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Rebuild markers when results or allPosadas change ────────────────────
  useEffect(() => {
    const L   = LRef.current
    const map = mapRef.current
    if (!L || !map) return

    markersRef.current.forEach(m => m.remove())
    markersRef.current.clear()

    const resultSlugs = new Set(results.map(r => r.posada.slug))

    // 1. Ghost markers for posadas NOT in current search results
    allPosadas.forEach(posada => {
      if (resultSlugs.has(posada.slug)) return
      const marker = addMarker(L, map, posada, 'ghost')
      markersRef.current.set(posada.slug, marker)
    })

    // 2. Active markers for search results (rendered on top)
    results.forEach(({ posada, isProximity }) => {
      const variant = isProximity ? 'proximity' : 'active'
      const marker = addMarker(L, map, posada, variant)
      markersRef.current.set(posada.slug, marker)
    })

    // Fit bounds — only if the user hasn't manually panned
    if (!userHasPannedRef.current) {
      const targets = results.length > 0 ? results.map(r => r.posada) : allPosadas
      if (targets.length > 0) {
        programmaticRef.current = true
        fitBounds(L, map, targets)
        setTimeout(() => { programmaticRef.current = false }, 1000)
      }
    }
  }, [results, allPosadas]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Hover highlight ───────────────────────────────────────────────────────
  useEffect(() => {
    markersRef.current.forEach((marker, slug) => {
      const el = marker.getElement()
      if (!el) return
      const inner = el.querySelector('.mkr') as HTMLElement | null
      if (!inner) return
      if (slug === hoveredSlug) {
        inner.classList.add('mkr-hov')
        marker.setZIndexOffset(1000)
      } else {
        inner.classList.remove('mkr-hov')
        marker.setZIndexOffset(0)
      }
    })
  }, [hoveredSlug])

  function addMarker(L: any, map: any, posada: Posada, variant: 'active' | 'proximity' | 'ghost') {
    const isGhost = variant === 'ghost'
    const cls = isGhost ? 'mkr ghost' : variant === 'proximity' ? 'mkr proximity' : 'mkr'
    // iconSize/Anchor must match the visual size for Leaflet to hit-test correctly
    const icon = L.divIcon({
      className: '',
      html: `<div class="${cls}">$${posada.precio}</div>`,
      iconSize:   [1, 1],   // will be overridden by CSS natural size; 1×1 prevents Leaflet clipping
      iconAnchor: [0, 0],   // CSS handles centering via transform
    })

    const marker = L.marker([posada.lat, posada.lng], {
      icon,
      zIndexOffset: isGhost ? 0 : 500,
      interactive: true,
      bubblingMouseEvents: false,
    }).addTo(map)

    // Leaflet events fire on the icon container element
    marker.on('mouseover', () => onHover(posada.slug))
    marker.on('mouseout',  () => onHover(null))
    marker.on('click',     () => { onSelect(posada.slug) })

    return marker
  }

  return (
    <>
      <style>{`
        /* ── Price pill marker ───────────────────────────────────────────────── */
        .mkr {
          /* Centre the pill on the lat/lng anchor */
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
          /* border-radius is explicitly set here and overridden back in globals.css via
             .leaflet-container .mkr { border-radius: 999px !important } */
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
          background: rgba(100,115,135,0.55);
          border-color: rgba(255,255,255,0.8);
          font-size: 11px;
          padding: 4px 9px;
          box-shadow: 0 1px 5px rgba(0,0,0,0.12);
        }
        .mkr.proximity { background: #7A8699; }

        /* Hover state applied via JS to the .mkr element directly */
        .mkr.mkr-hov {
          background: #E67E22 !important;
          transform: translate(-50%, -50%) scale(1.18) !important;
          box-shadow: 0 5px 18px rgba(230,126,34,0.50) !important;
          z-index: 9999;
        }

        /* Leaflet controls */
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
        style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}
      />
    </>
  )
}

function fitBounds(L: any, map: any, posadas: Posada[]) {
  if (posadas.length === 0) return
  if (posadas.length === 1) { map.setView([posadas[0].lat, posadas[0].lng], 11, { animate: true }); return }
  const bounds = L.latLngBounds(posadas.map(p => [p.lat, p.lng]))
  map.fitBounds(bounds, { padding: [56, 56], maxZoom: 12, animate: true })
}
