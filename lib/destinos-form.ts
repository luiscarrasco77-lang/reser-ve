import { venezuelaLocations } from './locations-ve'

// Destinos que puede elegir un posadero (con coordenadas por defecto). "otro" permite
// escribir la localidad a mano.
const BASE = [
  { label: 'Los Roques', slug: 'los-roques', lat: 11.85, lng: -66.75 },
  { label: 'Mérida', slug: 'merida', lat: 8.6, lng: -71.15 },
  { label: 'Mochima', slug: 'mochima', lat: 10.35, lng: -64.35 },
  { label: 'Morrocoy', slug: 'morrocoy', lat: 10.87, lng: -68.22 },
  { label: 'Canaima', slug: 'canaima', lat: 6.23, lng: -62.85 },
  { label: 'Isla Margarita', slug: 'isla-margarita', lat: 10.97, lng: -63.91 },
  { label: 'Roraima', slug: 'roraima', lat: 5.14, lng: -60.76 },
  { label: 'Choroní', slug: 'choroni', lat: 10.49, lng: -67.62 },
  { label: 'Puerto Colombia', slug: 'puerto-colombia', lat: 10.53, lng: -67.65 },
  { label: 'Coro', slug: 'coro', lat: 11.4, lng: -69.67 },
]

export type DestinoOpcion = { label: string; slug: string; lat: number; lng: number }

export const DESTINOS: DestinoOpcion[] = [
  ...BASE,
  ...venezuelaLocations
    .filter(l => !BASE.some(b => b.slug === l.id))
    .map(l => ({ label: l.nombre, slug: l.id, lat: l.lat, lng: l.lng })),
].sort((a, b) => a.label.localeCompare(b.label, 'es'))

export const OTRO = 'otro'

export function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
