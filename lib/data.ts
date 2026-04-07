export type Posada = {
  slug: string
  nombre: string
  destino: string
  destinoSlug: string
  tipo: string
  precio: number
  habitaciones: number
  rating: number
  reviews: number
  tags: string[]
  descripcion: string
  servicios: string[]
  politicas: string[]
  imgs: string[]
  host: { nombre: string; desde: string; idiomas: string[] }
  reseñas: { autor: string; pais: string; rating: number; texto: string }[]
}

export type Destino = {
  slug: string
  nombre: string
  tagline: string
  descripcion: string
  hero: string
  posadaSlugs: string[]
}

export const posadas: Posada[] = [
  {
    slug: 'posada-sol-roques',
    nombre: 'Posada Sol de Los Roques',
    destino: 'Los Roques',
    destinoSlug: 'los-roques',
    tipo: 'Archipiélago',
    precio: 120,
    habitaciones: 8,
    rating: 4.9,
    reviews: 47,
    tags: ['Frente al mar', 'Desayuno incluido', 'Snorkel'],
    descripcion:
      'Enclavada frente al mar cristalino del archipiélago de Los Roques, esta posada familiar ofrece una experiencia auténtica venezolana. Despertarás con el sonido de las olas y el olor a café recién hecho. Nuestras habitaciones tienen vista directa al mar y acceso privado a la playa de arena blanca.',
    servicios: ['Desayuno incluido', 'Snorkel', 'Wi-Fi', 'Aire acondicionado', 'Traslado en lancha', 'Bar de playa'],
    politicas: ['Check-in: 2:00 PM', 'Check-out: 11:00 AM', 'No se admiten mascotas', 'Cancelación gratuita 48h antes'],
    imgs: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80',
      'https://images.unsplash.com/photo-1582610116397-edb318620f90?w=1200&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80',
    ],
    host: { nombre: 'María González', desde: '2019', idiomas: ['Español', 'Inglés'] },
    reseñas: [
      { autor: 'Carlos M.', pais: 'España', rating: 5, texto: 'Increíble experiencia. Las mejores aguas turquesas que he visto en mi vida. María es una anfitriona excepcional.' },
      { autor: 'Ana R.', pais: 'Miami, EE.UU.', rating: 5, texto: 'Volví a Venezuela después de 8 años y esta posada superó todas mis expectativas. Como regresar a casa.' },
      { autor: 'Pierre L.', pais: 'Francia', rating: 4, texto: 'Paradise on earth. The snorkeling is absolutely spectacular. Will definitely come back.' },
    ],
  },
  {
    slug: 'posada-los-andes',
    nombre: 'Posada Los Andes de Mérida',
    destino: 'Mérida',
    destinoSlug: 'merida',
    tipo: 'Los Andes',
    precio: 65,
    habitaciones: 12,
    rating: 4.8,
    reviews: 83,
    tags: ['Vista a la montaña', 'Chimenea', 'Senderismo'],
    descripcion:
      'Ubicada en el corazón de los Andes venezolanos, esta posada colonial combina la calidez de la arquitectura tradicional con todas las comodidades modernas. Ideal para los amantes del senderismo, la naturaleza y la gastronomía andina. A pocos minutos del teleférico más alto del mundo.',
    servicios: ['Chimenea', 'Desayuno andino', 'Wi-Fi', 'Estacionamiento', 'Tours guiados', 'Agua caliente'],
    politicas: ['Check-in: 3:00 PM', 'Check-out: 12:00 PM', 'Se admiten mascotas pequeñas', 'Cancelación gratuita 72h antes'],
    imgs: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&q=80',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80',
    ],
    host: { nombre: 'Roberto Pérez', desde: '2017', idiomas: ['Español'] },
    reseñas: [
      { autor: 'Luisa T.', pais: 'Bogotá, Colombia', rating: 5, texto: 'Los Andes venezolanos son mágicos y esta posada los complementa perfectamente. El desayuno andino es espectacular.' },
      { autor: 'Miguel S.', pais: 'Caracas, Venezuela', rating: 5, texto: 'Perfecto para desconectarse. Roberto conoce cada sendero de la montaña y comparte esa pasión con los huéspedes.' },
    ],
  },
  {
    slug: 'posada-mochima-azul',
    nombre: 'Posada Mochima Azul',
    destino: 'Mochima',
    destinoSlug: 'mochima',
    tipo: 'Costa Oriental',
    precio: 85,
    habitaciones: 6,
    rating: 4.7,
    reviews: 31,
    tags: ['Playa privada', 'Kayak', 'Pesca'],
    descripcion:
      'Situada en el corazón del Parque Nacional Mochima, esta posada ofrece acceso directo a playas vírgenes y aguas cristalinas. Perfecta para los amantes del mar, el buceo y la pesca deportiva. Disfruta de atardeceres únicos desde tu hamaca frente al Caribe venezolano.',
    servicios: ['Playa privada', 'Kayak', 'Wi-Fi', 'Aire acondicionado', 'Equipo de snorkel', 'Cocina equipada'],
    politicas: ['Check-in: 2:00 PM', 'Check-out: 11:00 AM', 'No se admiten mascotas', 'Cancelación gratuita 48h antes'],
    imgs: [
      'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=1200&q=80',
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=80',
    ],
    host: { nombre: 'Carmen Rodríguez', desde: '2021', idiomas: ['Español', 'Inglés'] },
    reseñas: [
      { autor: 'Juan P.', pais: 'Caracas, Venezuela', rating: 5, texto: 'Las playas de Mochima son un secreto bien guardado. Esta posada tiene la mejor ubicación de la zona.' },
      { autor: 'Sophie M.', pais: 'Canadá', rating: 4, texto: 'Great location, lovely hosts. The kayaking trips were absolutely amazing!' },
    ],
  },
  {
    slug: 'posada-morrocoy',
    nombre: 'Posada Morrocoy Paradise',
    destino: 'Morrocoy',
    destinoSlug: 'morrocoy',
    tipo: 'Costa Occidental',
    precio: 95,
    habitaciones: 10,
    rating: 4.6,
    reviews: 58,
    tags: ['Manglar', 'Buceo', 'Puesta de sol'],
    descripcion:
      'En el corazón del Parque Nacional Morrocoy, esta posada es el punto de partida ideal para explorar los cayos más hermosos del Caribe venezolano. Con lancha propia y guías locales expertos, vivirás una experiencia única entre manglares, flamencos y aguas turquesas.',
    servicios: ['Lancha propia', 'Tours a los cayos', 'Wi-Fi', 'Desayuno incluido', 'Equipo de buceo', 'Bar al atardecer'],
    politicas: ['Check-in: 2:00 PM', 'Check-out: 11:00 AM', 'No se admiten mascotas', 'Cancelación gratuita 48h antes'],
    imgs: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
      'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=1200&q=80',
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=80',
    ],
    host: { nombre: 'Luis Fernández', desde: '2018', idiomas: ['Español'] },
    reseñas: [
      { autor: 'Diana R.', pais: 'Bogotá, Colombia', rating: 5, texto: 'Los cayos de Morrocoy son una maravilla. El tour en lancha incluido en el paquete no tiene precio.' },
      { autor: 'Marco A.', pais: 'Italia', rating: 4, texto: 'Beautiful location. The sunsets over the mangroves are something I will never forget.' },
    ],
  },
  {
    slug: 'posada-canaima',
    nombre: 'Posada Canaima Lodge',
    destino: 'Canaima',
    destinoSlug: 'canaima',
    tipo: 'Gran Sabana',
    precio: 150,
    habitaciones: 5,
    rating: 5.0,
    reviews: 22,
    tags: ['Tepuyes', 'Salto Ángel', 'Todo incluido'],
    descripcion:
      'Una experiencia única en uno de los destinos más espectaculares del planeta. Ubicada en el Parque Nacional Canaima, esta posada te lleva al pie del Salto Ángel, la cascada más alta del mundo. El paquete todo incluido combina comodidad, aventura y naturaleza salvaje en estado puro.',
    servicios: ['Todo incluido', 'Tour al Salto Ángel', 'Wi-Fi satelital', 'Guía nativo', 'Canoa tradicional', 'Cocina criolla'],
    politicas: ['Check-in: 12:00 PM', 'Check-out: 10:00 AM', 'No se admiten mascotas', 'Sin cancelación (reserva confirmada)'],
    imgs: [
      'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=80',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
    ],
    host: { nombre: 'Pedro Yekuana', desde: '2015', idiomas: ['Español', 'Pemón'] },
    reseñas: [
      { autor: 'Sandra B.', pais: 'Alemania', rating: 5, texto: 'Canaima cambió mi vida. Pedro conoce cada rincón del tepuy y comparte una pasión genuina por preservar este lugar.' },
      { autor: 'Ramón T.', pais: 'Caracas, Venezuela', rating: 5, texto: 'Todo incluido y sin sorpresas. La mejor forma de ver el Salto Ángel con confort y autenticidad.' },
    ],
  },
  {
    slug: 'posada-margarita',
    nombre: 'Posada Isla Bella Margarita',
    destino: 'Isla Margarita',
    destinoSlug: 'isla-margarita',
    tipo: 'Caribe',
    precio: 75,
    habitaciones: 15,
    rating: 4.5,
    reviews: 112,
    tags: ['Piscina', 'Beach bar', 'Kitesurf'],
    descripcion:
      'En la perla del Caribe venezolano, esta posada combina el encanto tropical con todas las comodidades modernas. A pasos de Playa El Agua, la más famosa de la isla, con piscina, beach bar y zona de kitesurf. El destino ideal para quienes buscan sol, fiesta y playa con cama cómoda.',
    servicios: ['Piscina', 'Beach bar', 'Wi-Fi', 'Aire acondicionado', 'Estacionamiento', 'Clases de kitesurf'],
    politicas: ['Check-in: 3:00 PM', 'Check-out: 12:00 PM', 'Se admiten mascotas pequeñas', 'Cancelación gratuita 24h antes'],
    imgs: [
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
      'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=1200&q=80',
    ],
    host: { nombre: 'Valentina Cruz', desde: '2016', idiomas: ['Español', 'Inglés', 'Portugués'] },
    reseñas: [
      { autor: 'Andrea G.', pais: 'Miami, EE.UU.', rating: 5, texto: 'La mejor opción calidad-precio en Margarita. Valentina hace que todo sea fácil y agradable.' },
      { autor: 'Thomas H.', pais: 'Reino Unido', rating: 4, texto: 'Excellent value for money. The kitesurf classes were top notch. Will definitely return.' },
      { autor: 'Gabriela M.', pais: 'Caracas, Venezuela', rating: 5, texto: 'La piscina y el beach bar son increíbles. Perfecta para grupos de amigos.' },
    ],
  },
]

export const destinos: Destino[] = [
  {
    slug: 'los-roques',
    nombre: 'Los Roques',
    tagline: 'Archipiélago',
    descripcion: 'Descubre posadas auténticas en Los Roques, con una experiencia más cálida, cuidada y conectada con el destino.',
    hero: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=80',
    posadaSlugs: ['posada-sol-roques'],
  },
  {
    slug: 'merida',
    nombre: 'Mérida',
    tagline: 'Los Andes',
    descripcion: 'Encuentra posadas acogedoras en Mérida, rodeadas de montaña, naturaleza y una hospitalidad auténtica.',
    hero: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80',
    posadaSlugs: ['posada-los-andes'],
  },
  {
    slug: 'mochima',
    nombre: 'Mochima',
    tagline: 'Costa Oriental',
    descripcion: 'Explora posadas en Mochima para una experiencia frente al mar, entre naturaleza, playa y tranquilidad.',
    hero: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=1600&q=80',
    posadaSlugs: ['posada-mochima-azul'],
  },
  {
    slug: 'morrocoy',
    nombre: 'Morrocoy',
    tagline: 'Costa Occidental',
    descripcion: 'Descubre posadas disponibles en Morrocoy para disfrutar de playas increíbles y una escapada cálida.',
    hero: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80',
    posadaSlugs: ['posada-morrocoy'],
  },
  {
    slug: 'canaima',
    nombre: 'Canaima',
    tagline: 'Gran Sabana',
    descripcion: 'Hospédate cerca de uno de los destinos más extraordinarios de Venezuela con una experiencia auténtica.',
    hero: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80',
    posadaSlugs: ['posada-canaima'],
  },
  {
    slug: 'isla-margarita',
    nombre: 'Isla Margarita',
    tagline: 'Caribe',
    descripcion: 'Encuentra posadas boutique en Isla Margarita para una experiencia relajada, tropical y memorable.',
    hero: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1600&q=80',
    posadaSlugs: ['posada-margarita'],
  },
]

export function getPosada(slug: string): Posada | undefined {
  return posadas.find(p => p.slug === slug)
}

export function getDestino(slug: string): Destino | undefined {
  return destinos.find(d => d.slug === slug)
}

export function getPosadasByDestino(destinoSlug: string): Posada[] {
  return posadas.filter(p => p.destinoSlug === destinoSlug)
}
