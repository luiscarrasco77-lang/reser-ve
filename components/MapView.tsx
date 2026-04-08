'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { Posada } from '@/lib/data'
import type { SearchResult } from '@/lib/search'

type Props = {
  results: SearchResult[]        // search-filtered results (shown prominently)
  allPosadas: Posada[]           // ALL posadas (shown as dim markers when in view)
  hoveredSlug: string | null
  onHover: (slug: string | null) => void
  onSelect: (slug: string) => void
  onViewportChange?: (slugsInView: string[]) => void
}

export default function MapView({ results, allPosadas, hoveredSlug, onHover, onSelect, onViewportChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)
  const markersRef   = useRef<Map<string, any>>(new Map())
  const LRef         = useRef<any>(null)
  const onViewportChangeRef = useRef(onViewportChange)

  useEffect(() => { onViewportChangeRef.current = onViewportChange }, [onViewportChange])

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
        preferCanvas: false,
      })
      mapRef.current = map

      // ── CartoDB Positron — minimal, matches our palette ────────────────
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
          subdomains: 'abcd',
          maxZoom: 20,
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        }
      ).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)
      L.control.attribution({ position: 'bottomleft', prefix: '© OSM · CARTO' }).addTo(map)

      // ── Emit visible slugs on move ─────────────────────────────────────
      function emitVisible() {
        if (!onViewportChangeRef.current) return
        const bounds = map.getBounds()
        const visible: string[] = []
        markersRef.current.forEach((_, slug) => {
          const marker = markersRef.current.get(slug)
          if (marker && bounds.contains(marker.getLatLng())) visible.push(slug)
        })
        onViewportChangeRef.current(visible)
      }

      map.on('moveend zoomend', emitVisible)
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markersRef.current.clear()
      }
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

    // 1. Draw "ghost" markers for all posadas NOT in current results
    allPosadas.forEach(posada => {
      if (resultSlugs.has(posada.slug)) return // drawn in step 2
      const icon = makePriceIcon(L, posada.precio, 'ghost')
      const marker = L.marker([posada.lat, posada.lng], { icon, zIndexOffset: 0 }).addTo(map)
      marker.on('mouseover', () => onHover(posada.slug))
      marker.on('mouseout',  () => onHover(null))
      marker.on('click',     () => onSelect(posada.slug))
      markersRef.current.set(posada.slug, marker)
    })

    // 2. Draw active markers for search results (on top)
    results.forEach(({ posada, isProximity }) => {
      const icon = makePriceIcon(L, posada.precio, isProximity ? 'proximity' : 'active')
      const marker = L.marker([posada.lat, posada.lng], { icon, zIndexOffset: 500 }).addTo(map)
      marker.on('mouseover', () => onHover(posada.slug))
      marker.on('mouseout',  () => onHover(null))
      marker.on('click',     () => onSelect(posada.slug))
      markersRef.current.set(posada.slug, marker)
    })

    // Fit to results if any, else fit all
    fitBounds(L, map, results.length > 0 ? results.map(r => r.posada) : allPosadas)
  }, [results, allPosadas]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Highlight hovered marker ──────────────────────────────────────────────
  useEffect(() => {
    markersRef.current.forEach((marker, slug) => {
      const el = marker.getElement()
      if (!el) return
      if (slug === hoveredSlug) {
        el.classList.add('mkr-hov')
        marker.setZIndexOffset(1000)
      } else {
        el.classList.remove('mkr-hov')
        marker.setZIndexOffset(markersRef.current.has(slug) ? 500 : 0)
      }
    })
  }, [hoveredSlug])

  return (
    <>
      <style>{`
        .mkr {
          background: #1A2B4C;
          color: white;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 12px;
          font-weight: 700;
          padding: 5px 10px;
          border-radius: 999px;
          border: 2.5px solid white;
          box-shadow: 0 2px 10px rgba(26,43,76,0.28);
          white-space: nowrap;
          cursor: pointer;
          transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
          transform-origin: bottom center;
          letter-spacing: -0.01em;
        }
        .mkr.ghost {
          background: rgba(122,134,153,0.55);
          border-color: rgba(255,255,255,0.7);
          box-shadow: 0 1px 5px rgba(0,0,0,0.12);
          font-size: 11px;
          padding: 4px 8px;
        }
        .mkr.proximity {
          background: #7A8699;
        }
        .mkr-hov .mkr {
          background: #E67E22 !important;
          transform: scale(1.18) translateY(-2px);
          box-shadow: 0 6px 20px rgba(230,126,34,0.45) !important;
        }
        /* Leaflet zoom buttons */
        .leaflet-control-zoom a {
          border-radius: 8px !important;
          color: #1A2B4C !important;
          font-weight: 700;
        }
        /* Attribution */
        .leaflet-control-attribution {
          font-size: 9px !important;
          background: rgba(255,255,255,0.7) !important;
          backdrop-filter: blur(4px);
        }
      `}</style>
      <div ref={containerRef} style={{ width: '100%', height: '100%', borderRadius: 'inherit' }} />
    </>
  )
}

function makePriceIcon(L: any, precio: number, variant: 'active' | 'proximity' | 'ghost') {
  const cls = variant === 'active' ? 'mkr' : `mkr ${variant}`
  return L.divIcon({
    className: '',
    html: `<div class="${cls}">$${precio}</div>`,
    iconSize:   [0, 0],
    iconAnchor: [0, 0],
    popupAnchor:[0, -10],
  })
}

function fitBounds(L: any, map: any, posadas: Posada[]) {
  if (posadas.length === 0) return
  if (posadas.length === 1) {
    map.setView([posadas[0].lat, posadas[0].lng], 11)
    return
  }
  const bounds = L.latLngBounds(posadas.map(p => [p.lat, p.lng]))
  map.fitBounds(bounds, { padding: [52, 52], maxZoom: 12 })
}
