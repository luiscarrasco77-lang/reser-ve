'use client'

import { useEffect, useRef } from 'react'
import type { Posada } from '@/lib/data'
import type { SearchResult } from '@/lib/search'

type Props = {
  results: SearchResult[]
  allPosadas: Posada[]
  hoveredSlug: string | null
  onHover: (slug: string | null) => void
  onSelect: (slug: string) => void
  onViewportChange?: (slugsInView: string[]) => void
  onUserPan?: () => void
}

export default function MapView({
  results, allPosadas, hoveredSlug, onHover, onSelect, onViewportChange, onUserPan,
}: Props) {
  const containerRef       = useRef<HTMLDivElement>(null)
  const mapRef             = useRef<any>(null)
  const markersRef         = useRef<Map<string, any>>(new Map())
  const LRef               = useRef<any>(null)
  const programmaticRef    = useRef(false)   // true during fitBounds so moveend ignores it
  const onViewportChangeRef = useRef(onViewportChange)
  const onUserPanRef        = useRef(onUserPan)

  useEffect(() => { onViewportChangeRef.current = onViewportChange }, [onViewportChange])
  useEffect(() => { onUserPanRef.current = onUserPan }, [onUserPan])

  // ── Init map ─────────────────────────────────────────────────────────────
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
      })
      mapRef.current = map

      // CartoDB Positron – minimal, clean, matches brand palette
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        { subdomains: 'abcd', maxZoom: 20 }
      ).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)
      L.control.attribution({
        position: 'bottomleft',
        prefix: '<a href="https://www.openstreetmap.org/copyright">OSM</a> · <a href="https://carto.com">CARTO</a>',
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

      map.on('moveend zoomend', () => {
        if (!programmaticRef.current) {
          onUserPanRef.current?.()
        }
        emitVisible()
      })
    })

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markersRef.current.clear() }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Rebuild markers ───────────────────────────────────────────────────────
  useEffect(() => {
    const L   = LRef.current
    const map = mapRef.current
    if (!L || !map) return

    markersRef.current.forEach(m => m.remove())
    markersRef.current.clear()

    const resultSlugs = new Set(results.map(r => r.posada.slug))

    // Ghost markers for all posadas not in results
    allPosadas.forEach(posada => {
      if (resultSlugs.has(posada.slug)) return
      const marker = L.marker([posada.lat, posada.lng], {
        icon: makeIcon(L, posada.precio, 'ghost'),
        zIndexOffset: 0,
        interactive: true,
      }).addTo(map)
      marker.on('mouseover', () => onHover(posada.slug))
      marker.on('mouseout',  () => onHover(null))
      marker.on('click',     () => onSelect(posada.slug))
      markersRef.current.set(posada.slug, marker)
    })

    // Active markers for search results (on top)
    results.forEach(({ posada, isProximity }) => {
      const marker = L.marker([posada.lat, posada.lng], {
        icon: makeIcon(L, posada.precio, isProximity ? 'proximity' : 'active'),
        zIndexOffset: 500,
        interactive: true,
      }).addTo(map)
      marker.on('mouseover', () => onHover(posada.slug))
      marker.on('mouseout',  () => onHover(null))
      marker.on('click',     () => onSelect(posada.slug))
      markersRef.current.set(posada.slug, marker)
    })

    // Fit bounds (programmatic — suppress onUserPan)
    const targets = results.length > 0 ? results.map(r => r.posada) : allPosadas
    if (targets.length > 0) {
      programmaticRef.current = true
      fitBounds(L, map, targets)
      setTimeout(() => { programmaticRef.current = false }, 800)
    }
  }, [results, allPosadas]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Hover highlight ───────────────────────────────────────────────────────
  useEffect(() => {
    markersRef.current.forEach((marker, slug) => {
      const el = marker.getElement()
      if (!el) return
      if (slug === hoveredSlug) {
        el.classList.add('mkr-hov'); marker.setZIndexOffset(1000)
      } else {
        el.classList.remove('mkr-hov'); marker.setZIndexOffset(0)
      }
    })
  }, [hoveredSlug])

  return (
    <>
      <style>{`
        /* Pill marker */
        .mkr-anchor {
          position: absolute; left: 0; top: 0;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .mkr {
          position: relative;
          pointer-events: all;
          display: inline-flex;
          align-items: center;
          background: #1A2B4C;
          color: white;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 12px;
          font-weight: 700;
          padding: 5px 11px;
          border-radius: 999px;
          border: 2.5px solid white;
          box-shadow: 0 2px 10px rgba(26,43,76,0.30);
          white-space: nowrap;
          cursor: pointer;
          transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
          letter-spacing: -0.01em;
        }
        .mkr.ghost {
          background: rgba(122,134,153,0.48);
          border-color: rgba(255,255,255,0.75);
          font-size: 11px;
          padding: 4px 8px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.10);
        }
        .mkr.proximity { background: #7A8699; }
        .mkr-hov .mkr {
          background: #E67E22 !important;
          transform: scale(1.2);
          box-shadow: 0 5px 18px rgba(230,126,34,0.50) !important;
        }
        .mkr-hov .mkr.ghost {
          background: #E67E22 !important;
        }
        /* Zoom controls */
        .leaflet-control-zoom a {
          border-radius: 8px !important;
          color: #1A2B4C !important;
          font-weight: 600 !important;
          border-color: rgba(26,43,76,0.15) !important;
        }
        .leaflet-control-zoom a:hover { background: #f0f4f8 !important; }
        /* Attribution */
        .leaflet-control-attribution {
          font-size: 9px !important;
          background: rgba(255,255,255,0.72) !important;
          backdrop-filter: blur(4px);
          border-radius: 6px 0 0 0 !important;
        }
      `}</style>
      <div ref={containerRef} style={{ width: '100%', height: '100%', borderRadius: 'inherit' }} />
    </>
  )
}

function makeIcon(L: any, precio: number, variant: 'active' | 'proximity' | 'ghost') {
  const cls = variant === 'active' ? 'mkr' : `mkr ${variant}`
  return L.divIcon({
    className: '',
    // Wrap in absolute-positioned div so marker is centred on lat/lng without needing iconAnchor arithmetic
    html: `<div class="mkr-anchor"><div class="${cls}">$${precio}</div></div>`,
    iconSize: [1, 1],
    iconAnchor: [0, 0],
  })
}

function fitBounds(L: any, map: any, posadas: Posada[]) {
  if (posadas.length === 0) return
  if (posadas.length === 1) { map.setView([posadas[0].lat, posadas[0].lng], 11); return }
  const bounds = L.latLngBounds(posadas.map(p => [p.lat, p.lng]))
  map.fitBounds(bounds, { padding: [56, 56], maxZoom: 12 })
}
