'use client'

import { useEffect, useRef } from 'react'
import type { SearchResult } from '@/lib/search'

type Props = {
  results: SearchResult[]
  hoveredSlug: string | null
  onHover: (slug: string | null) => void
  onSelect: (slug: string) => void
}

export default function MapView({ results, hoveredSlug, onHover, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const LRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Dynamically import Leaflet (needs window)
    import('leaflet').then(L => {
      LRef.current = L

      // Fix default marker icon paths broken by Webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(containerRef.current!, {
        center: [8.0, -66.5],
        zoom: 6,
        zoomControl: false,
        attributionControl: false,
      })
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map)

      L.control.zoom({ position: 'topright' }).addTo(map)
      L.control.attribution({ position: 'bottomright', prefix: '© OpenStreetMap' }).addTo(map)

      addMarkers(L, map, results)
      fitBounds(L, map, results)
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markersRef.current.clear()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers when results change
  useEffect(() => {
    const L = LRef.current
    const map = mapRef.current
    if (!L || !map) return

    // Remove old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current.clear()

    addMarkers(L, map, results)
    if (results.length > 0) fitBounds(L, map, results)
  }, [results]) // eslint-disable-line react-hooks/exhaustive-deps

  // Highlight hovered marker
  useEffect(() => {
    markersRef.current.forEach((marker, slug) => {
      const el = marker.getElement()
      if (!el) return
      if (slug === hoveredSlug) {
        el.classList.add('map-marker-hovered')
        marker.setZIndexOffset(1000)
      } else {
        el.classList.remove('map-marker-hovered')
        marker.setZIndexOffset(0)
      }
    })
  }, [hoveredSlug])

  function createPriceIcon(L: any, precio: number, isProximity: boolean) {
    const label = `$${precio}`
    return L.divIcon({
      className: '',
      html: `<div class="map-price-marker${isProximity ? ' proximity' : ''}">${label}</div>`,
      iconSize: [56, 28],
      iconAnchor: [28, 14],
    })
  }

  function addMarkers(L: any, map: any, results: SearchResult[]) {
    results.forEach(({ posada, isProximity }) => {
      const icon = createPriceIcon(L, posada.precio, isProximity)
      const marker = L.marker([posada.lat, posada.lng], { icon })
        .addTo(map)

      marker.on('mouseover', () => onHover(posada.slug))
      marker.on('mouseout', () => onHover(null))
      marker.on('click', () => onSelect(posada.slug))

      // Popup
      marker.bindPopup(`
        <div class="map-popup">
          <img src="${posada.imgs[0]}" alt="${posada.nombre}" />
          <div class="map-popup-body">
            <div class="map-popup-name">${posada.nombre}</div>
            <div class="map-popup-meta">★ ${posada.rating} · $${posada.precio}/noche</div>
          </div>
        </div>
      `, { maxWidth: 200, className: 'map-popup-wrap' })

      markersRef.current.set(posada.slug, marker)
    })
  }

  function fitBounds(L: any, map: any, results: SearchResult[]) {
    if (results.length === 0) return
    if (results.length === 1) {
      map.setView([results[0].posada.lat, results[0].posada.lng], 10)
      return
    }
    const coords = results.map(r => [r.posada.lat, r.posada.lng] as [number, number])
    const bounds = L.latLngBounds(coords)
    map.fitBounds(bounds, { padding: [48, 48] })
  }

  return (
    <>
      <style>{`
        .map-price-marker {
          background: #1A2B4C;
          color: white;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 700;
          padding: 5px 9px;
          border-radius: 999px;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.18s ease;
          transform-origin: bottom center;
        }
        .map-price-marker.proximity {
          background: #7A8699;
        }
        .map-marker-hovered .map-price-marker {
          background: #E67E22 !important;
          transform: scale(1.15);
          box-shadow: 0 4px 16px rgba(230,126,34,0.5);
          z-index: 999 !important;
        }
        .map-popup-wrap .leaflet-popup-content-wrapper {
          border-radius: 16px;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 12px 40px rgba(0,0,0,0.2);
        }
        .map-popup-wrap .leaflet-popup-content {
          margin: 0;
          width: 200px !important;
        }
        .map-popup-wrap .leaflet-popup-tip-container { display: none; }
        .map-popup img {
          width: 100%;
          height: 100px;
          object-fit: cover;
          display: block;
        }
        .map-popup-body {
          padding: 10px 12px;
        }
        .map-popup-name {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: #1A2B4C;
          line-height: 1.3;
          margin-bottom: 3px;
        }
        .map-popup-meta {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          color: #7A8699;
        }
        .leaflet-container {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}
      />
    </>
  )
}
