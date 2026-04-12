import type { Posada } from './data'

export type Region = {
  id: string
  nombre: string
  lat: number
  lng: number
  sub: string  // shown as subtitle in suggestions
  keywords: string[]  // match against posada.destino + posada.destinoSlug
}

export const regions: Region[] = [
  {
    id: 'caribe-occidental',
    nombre: 'Caribe Occidental',
    lat: 11.2, lng: -70.0,
    sub: 'Falcón, Paraguaná, Adícora, Zulia',
    keywords: ['falcon', 'paraguaná', 'paraguana', 'adicora', 'médanos', 'medanos', 'coro', 'zulia', 'maracaibo', 'chichiriviche', 'morrocoy', 'punto fijo'],
  },
  {
    id: 'caribe-central',
    nombre: 'Caribe Central',
    lat: 10.52, lng: -67.55,
    sub: 'La Guaira, Choroní, Chuao, Morrocoy',
    keywords: ['la guaira', 'vargas', 'choroni', 'choroní', 'chuao', 'maiquetia', 'caraballeda', 'naiguata', 'macuto', 'catia la mar', 'aragua', 'maracay', 'puerto colombia'],
  },
  {
    id: 'caribe-oriental',
    nombre: 'Caribe Oriental',
    lat: 10.3, lng: -64.45,
    sub: 'Mochima, Río Caribe, Sucre, Anzoátegui',
    keywords: ['sucre', 'mochima', 'rio caribe', 'anzoategui', 'anzoátegui', 'cumana', 'cumaná', 'playa colorada', 'santa fe', 'lecheria', 'lechería', 'puerto la cruz', 'barcelona'],
  },
  {
    id: 'islas-caribe',
    nombre: 'Islas del Caribe',
    lat: 11.3, lng: -64.6,
    sub: 'Margarita, Los Roques, Coche, La Tortuga',
    keywords: ['margarita', 'nueva esparta', 'los roques', 'roques', 'la tortuga', 'coche', 'porlamar', 'pampatar', 'el yaque', 'gran roque', 'francisqui'],
  },
  {
    id: 'los-andes',
    nombre: 'Los Andes',
    lat: 8.2, lng: -71.3,
    sub: 'Mérida, Táchira, Trujillo',
    keywords: ['merida', 'mérida', 'tachira', 'táchira', 'trujillo', 'andes', 'mucuchies', 'mucuchíes', 'san cristobal', 'san cristóbal', 'tabay', 'sierra nevada'],
  },
  {
    id: 'los-llanos',
    nombre: 'Los Llanos',
    lat: 7.5, lng: -68.0,
    sub: 'Apure, Barinas, Guárico, Cojedes',
    keywords: ['apure', 'barinas', 'guarico', 'guárico', 'cojedes', 'llanos', 'hato', 'san fernando'],
  },
  {
    id: 'gran-sabana',
    nombre: 'Gran Sabana y Canaima',
    lat: 5.9, lng: -62.0,
    sub: 'Canaima, Roraima, Salto Ángel, Bolívar',
    keywords: ['bolivar', 'bolívar', 'canaima', 'roraima', 'salto angel', 'gran sabana', 'ciudad bolivar', 'ciudad bolívar', 'tepuy', 'tepuyes', 'auyantepui', 'kavak'],
  },
  {
    id: 'amazonas',
    nombre: 'Amazonas',
    lat: 3.5, lng: -66.5,
    sub: 'Puerto Ayacucho, selva amazónica',
    keywords: ['amazonas', 'puerto ayacucho', 'autana', 'tobogan', 'selva'],
  },
  {
    id: 'delta-orinoco',
    nombre: 'Delta del Orinoco',
    lat: 9.0, lng: -62.0,
    sub: 'Delta Amacuro, Tucupita',
    keywords: ['delta amacuro', 'delta', 'orinoco', 'tucupita', 'warao'],
  },
  {
    id: 'region-central',
    nombre: 'Región Central',
    lat: 10.2, lng: -67.8,
    sub: 'Caracas, Valencia, Barquisimeto',
    keywords: ['caracas', 'miranda', 'valencia', 'carabobo', 'barquisimeto', 'lara', 'distrito capital', 'dtto capital', 'el hatillo', 'chacao', 'higuerote'],
  },
]

export function findRegionsByQuery(q: string): Region[] {
  if (!q.trim()) return []
  const ql = q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return regions.filter(r => {
    const name = r.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const sub  = r.sub.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return name.includes(ql) || sub.includes(ql) || r.keywords.some(k => k.includes(ql) || ql.includes(k.substring(0, 5)))
  })
}

export function filterPosadasByRegion(posadas: Posada[], regionId: string): Posada[] {
  const region = regions.find(r => r.id === regionId)
  if (!region) return posadas
  return posadas.filter(p => {
    const hay = (p.destino + ' ' + p.destinoSlug).toLowerCase()
    return region.keywords.some(k => hay.includes(k))
  })
}
