export type Posada = {
  slug: string
  nombre: string
  destino: string
  destinoSlug: string
  tipo: string
  precio: number
  habitaciones: number
  capacidad: number
  rating: number
  reviews: number
  tags: string[]
  descripcion: string
  servicios: string[]
  politicas: string[]
  imgs: string[]
  host: { nombre: string; desde: string; idiomas: string[] }
  reseñas: { autor: string; pais: string; rating: number; texto: string }[]
  lat: number
  lng: number
  metodoPago: string[]
}

export type Destino = {
  slug: string
  nombre: string
  tagline: string
  descripcion: string
  hero: string
  posadaSlugs: string[]
}

// ─── Métodos de pago estándar de la plataforma ───────────────────────────────
export const METODOS_PAGO = ['Zelle', 'Pago Móvil', 'Transferencia bancaria', 'Efectivo USD', 'Efectivo Bs', 'Tarjeta'] as const

// Las imágenes son fotografías reales de destinos de Venezuela incluidas en el repo
// (public/images). Algunas contienen espacios en el nombre y van URL-encoded.
const IMG = {
  roquesHero: '/images/los-roques-hero.webp',
  roquesPenero: '/images/Los%20roques%20Penero.webp',
  palafitos: '/images/PalafitosEnElCielo.webp',
  archipielago: '/images/Archipielago.webp',
  cayoAgua: '/images/CayoDeAgua.webp',
  cayoSombrero: '/images/CayoSombero.webp',
  playaIndio: '/images/PlayaElIndio.webp',
  playaAgua: '/images/PlayaElAgua.webp',
  medina: '/images/MedinaEnCenitalII.webp',
  mochima: '/images/Mochima.webp',
  medanos: '/images/Medanos.webp',
  guacamaya: '/images/Guacamaya.webp',
  canaimaLodge: '/images/lodge-canaima_01.webp',
  wakuLodge: '/images/Waku-lodge-facilities-.webp',
  kerepa: '/images/KerepaKupaiWena.webp',
  kerepa2: '/images/KerepaKupaiWenaII.webp',
  mayupa: '/images/RapidosDeMayupa.webp',
  uruyen: '/images/UruyenI.webp',
  kukenan: '/images/Kukenan_Tepuy.jpg',
  jape: '/images/Jape.webp',
}

export const posadas: Posada[] = [
  {
    slug: 'posada-sol-roques',
    nombre: 'Posada Sol de Los Roques',
    destino: 'Los Roques',
    destinoSlug: 'los-roques',
    tipo: 'Frente al mar',
    precio: 135,
    habitaciones: 8,
    capacidad: 4,
    rating: 4.9,
    reviews: 47,
    tags: ['Frente al mar', 'Desayuno incluido', 'Snorkel'],
    descripcion:
      'Enclavada en el Gran Roque, frente al mar turquesa del archipiélago de Los Roques, esta posada familiar ofrece una experiencia caribeña auténtica. Despertarás con el sonido de las olas y el aroma del café recién colado, a pocos pasos de los peñeros que zarpan hacia los cayos.',
    servicios: ['Desayuno incluido', 'Snorkel', 'Wi-Fi', 'Aire acondicionado', 'Traslado en peñero', 'Terraza con vista al mar'],
    politicas: ['Check-in: 2:00 PM', 'Check-out: 11:00 AM', 'No se admiten mascotas', 'Cancelación gratuita 48h antes'],
    imgs: [IMG.roquesHero, IMG.palafitos, IMG.roquesPenero, IMG.archipielago],
    host: { nombre: 'María González', desde: '2019', idiomas: ['Español', 'Inglés'] },
    reseñas: [
      { autor: 'Carlos M.', pais: 'España', rating: 5, texto: 'Increíble experiencia. Las mejores aguas turquesas que he visto en mi vida.' },
      { autor: 'Ana R.', pais: 'Miami, EE.UU.', rating: 5, texto: 'Volví a Venezuela después de 8 años y esta posada superó todas mis expectativas.' },
      { autor: 'Pierre L.', pais: 'Francia', rating: 4, texto: 'Paradise on earth. The snorkeling is absolutely spectacular.' },
    ],
    lat: 11.9492,
    lng: -66.6717,
    metodoPago: ['Zelle', 'Transferencia bancaria', 'Efectivo USD'],
  },
  {
    slug: 'posada-cayo-agua',
    nombre: 'Posada Cayo de Agua',
    destino: 'Los Roques',
    destinoSlug: 'los-roques',
    tipo: 'Boutique de playa',
    precio: 160,
    habitaciones: 6,
    capacidad: 3,
    rating: 4.8,
    reviews: 34,
    tags: ['Boutique', 'Pensión completa', 'Kitesurf'],
    descripcion:
      'Un refugio boutique de seis habitaciones a orillas del Gran Roque, pensado para parejas y viajeros que buscan calma. Cocina de mar a mesa con pescado del día, salidas privadas a Cayo de Agua y atardeceres que tiñen el archipiélago de naranja.',
    servicios: ['Pensión completa', 'Salidas privadas a cayos', 'Wi-Fi', 'Aire acondicionado', 'Clases de kitesurf', 'Bar de playa'],
    politicas: ['Check-in: 1:00 PM', 'Check-out: 11:00 AM', 'Solo adultos', 'Cancelación gratuita 7 días antes'],
    imgs: [IMG.cayoAgua, IMG.archipielago, IMG.palafitos, IMG.roquesHero],
    host: { nombre: 'Valentina Cruz', desde: '2016', idiomas: ['Español', 'Inglés', 'Portugués'] },
    reseñas: [
      { autor: 'Thomas H.', pais: 'Reino Unido', rating: 5, texto: 'A boutique gem. The private boat trip to Cayo de Agua was the highlight of our trip.' },
      { autor: 'Gabriela M.', pais: 'Caracas, Venezuela', rating: 5, texto: 'Atención impecable y la comida espectacular. Volveremos sin duda.' },
    ],
    lat: 11.9478,
    lng: -66.6750,
    metodoPago: ['Zelle', 'Efectivo USD', 'Transferencia bancaria', 'Tarjeta'],
  },
  {
    slug: 'posada-los-andes',
    nombre: 'Posada Los Andes de Mérida',
    destino: 'Mérida',
    destinoSlug: 'merida',
    tipo: 'Casa de montaña',
    precio: 65,
    habitaciones: 12,
    capacidad: 4,
    rating: 4.8,
    reviews: 83,
    tags: ['Vista a la montaña', 'Chimenea', 'Senderismo'],
    descripcion:
      'En el corazón de los Andes venezolanos, esta casona colonial combina la calidez de la arquitectura tradicional merideña con todas las comodidades modernas. Punto de partida ideal para el teleférico de Mérida, los pueblos del páramo y rutas de senderismo.',
    servicios: ['Chimenea', 'Desayuno andino', 'Wi-Fi', 'Estacionamiento', 'Tours guiados', 'Agua caliente 24h'],
    politicas: ['Check-in: 3:00 PM', 'Check-out: 12:00 PM', 'Se admiten mascotas pequeñas', 'Cancelación gratuita 72h antes'],
    imgs: [IMG.guacamaya, IMG.jape, IMG.kukenan],
    host: { nombre: 'Roberto Pérez', desde: '2017', idiomas: ['Español'] },
    reseñas: [
      { autor: 'Luisa T.', pais: 'Bogotá, Colombia', rating: 5, texto: 'Los Andes venezolanos son mágicos y esta posada los complementa perfectamente.' },
      { autor: 'Miguel S.', pais: 'Caracas, Venezuela', rating: 5, texto: 'Perfecto para desconectarse. Roberto conoce cada sendero de la montaña.' },
    ],
    lat: 8.5897,
    lng: -71.1561,
    metodoPago: ['Transferencia bancaria', 'Pago Móvil', 'Efectivo USD', 'Efectivo Bs'],
  },
  {
    slug: 'posada-mochima-azul',
    nombre: 'Posada Mochima Azul',
    destino: 'Mochima',
    destinoSlug: 'mochima',
    tipo: 'Frente al mar',
    precio: 85,
    habitaciones: 6,
    capacidad: 4,
    rating: 4.7,
    reviews: 31,
    tags: ['Playa privada', 'Kayak', 'Pesca'],
    descripcion:
      'En el corazón del Parque Nacional Mochima, esta posada ofrece acceso directo a playas vírgenes y aguas cristalinas. Perfecta para los amantes del mar, el buceo y los recorridos en lancha entre islas desiertas.',
    servicios: ['Playa privada', 'Kayak', 'Wi-Fi', 'Aire acondicionado', 'Equipo de snorkel', 'Cocina equipada'],
    politicas: ['Check-in: 2:00 PM', 'Check-out: 11:00 AM', 'No se admiten mascotas', 'Cancelación gratuita 48h antes'],
    imgs: [IMG.mochima, IMG.medina, IMG.playaIndio],
    host: { nombre: 'Carmen Rodríguez', desde: '2021', idiomas: ['Español', 'Inglés'] },
    reseñas: [
      { autor: 'Juan P.', pais: 'Caracas, Venezuela', rating: 5, texto: 'Las playas de Mochima son un secreto bien guardado.' },
      { autor: 'Sophie M.', pais: 'Canadá', rating: 4, texto: 'Great location, lovely hosts. The kayaking trips were absolutely amazing!' },
    ],
    lat: 10.3656,
    lng: -64.3650,
    metodoPago: ['Zelle', 'Transferencia bancaria', 'Efectivo USD'],
  },
  {
    slug: 'posada-playa-medina',
    nombre: 'Posada Playa Medina',
    destino: 'Mochima',
    destinoSlug: 'mochima',
    tipo: 'Eco-playa',
    precio: 78,
    habitaciones: 5,
    capacidad: 4,
    rating: 4.9,
    reviews: 26,
    tags: ['Cocoteros', 'Eco-friendly', 'Romántica'],
    descripcion:
      'A la sombra de un palmar de cocoteros sobre la legendaria Playa Medina, en la costa de Sucre. Cabañas eco-amigables, arena dorada y un mar verde esmeralda. Uno de los rincones más fotografiados del oriente venezolano.',
    servicios: ['Desayuno incluido', 'Cabañas frente al mar', 'Wi-Fi', 'Tours en lancha', 'Hamacas', 'Cocina criolla'],
    politicas: ['Check-in: 2:00 PM', 'Check-out: 11:00 AM', 'Se admiten mascotas', 'Cancelación gratuita 72h antes'],
    imgs: [IMG.medina, IMG.mochima, IMG.playaIndio],
    host: { nombre: 'Andrea Salazar', desde: '2018', idiomas: ['Español', 'Inglés'] },
    reseñas: [
      { autor: 'Daniela V.', pais: 'Caracas, Venezuela', rating: 5, texto: 'El paraíso existe y queda en Sucre. Las cabañas bajo los cocoteros son un sueño.' },
      { autor: 'Marco A.', pais: 'Italia', rating: 5, texto: 'The most beautiful beach I have ever seen. Worth every mile of the trip.' },
    ],
    lat: 10.5500,
    lng: -63.1000,
    metodoPago: ['Zelle', 'Efectivo USD', 'Transferencia bancaria'],
  },
  {
    slug: 'posada-morrocoy',
    nombre: 'Posada Morrocoy Paradise',
    destino: 'Morrocoy',
    destinoSlug: 'morrocoy',
    tipo: 'Frente al mar',
    precio: 95,
    habitaciones: 10,
    capacidad: 5,
    rating: 4.6,
    reviews: 58,
    tags: ['Cayos', 'Buceo', 'Puesta de sol'],
    descripcion:
      'En el corazón del Parque Nacional Morrocoy, esta posada es el punto de partida ideal para explorar Cayo Sombrero y los cayos más hermosos del Caribe venezolano. Lancha propia, buceo y atardeceres sobre el manglar.',
    servicios: ['Lancha propia', 'Tours a los cayos', 'Wi-Fi', 'Desayuno incluido', 'Equipo de buceo', 'Bar al atardecer'],
    politicas: ['Check-in: 2:00 PM', 'Check-out: 11:00 AM', 'No se admiten mascotas', 'Cancelación gratuita 48h antes'],
    imgs: [IMG.cayoSombrero, IMG.cayoAgua, IMG.playaIndio],
    host: { nombre: 'Luis Fernández', desde: '2018', idiomas: ['Español'] },
    reseñas: [
      { autor: 'Diana R.', pais: 'Bogotá, Colombia', rating: 5, texto: 'Los cayos de Morrocoy son una maravilla. El tour en lancha no tiene precio.' },
      { autor: 'Marco A.', pais: 'Italia', rating: 4, texto: 'Beautiful location. The sunsets over the mangroves are unforgettable.' },
    ],
    lat: 10.8782,
    lng: -68.2531,
    metodoPago: ['Efectivo USD', 'Zelle', 'Transferencia bancaria'],
  },
  {
    slug: 'posada-canaima',
    nombre: 'Posada Canaima Lodge',
    destino: 'Canaima',
    destinoSlug: 'canaima',
    tipo: 'Lodge de selva',
    precio: 165,
    habitaciones: 5,
    capacidad: 4,
    rating: 5.0,
    reviews: 22,
    tags: ['Salto Ángel', 'Todo incluido', 'Laguna de Canaima'],
    descripcion:
      'Una experiencia única en uno de los destinos más espectaculares del planeta. A orillas de la laguna de Canaima, este lodge es el punto de partida para la excursión al Salto Ángel (Kerepakupai Vená), la caída de agua más alta del mundo.',
    servicios: ['Todo incluido', 'Tour al Salto Ángel', 'Wi-Fi satelital', 'Guía nativo Pemón', 'Curiara tradicional', 'Cocina criolla'],
    politicas: ['Check-in: 12:00 PM', 'Check-out: 10:00 AM', 'No se admiten mascotas', 'Cancelación gratuita 7 días antes'],
    imgs: [IMG.canaimaLodge, IMG.kerepa, IMG.kerepa2, IMG.mayupa],
    host: { nombre: 'Pedro Yekuana', desde: '2015', idiomas: ['Español', 'Pemón'] },
    reseñas: [
      { autor: 'Sandra B.', pais: 'Alemania', rating: 5, texto: 'Canaima cambió mi vida. Pedro comparte una pasión genuina por preservar este lugar.' },
      { autor: 'Ramón T.', pais: 'Caracas, Venezuela', rating: 5, texto: 'La mejor forma de ver el Salto Ángel con confort y autenticidad.' },
    ],
    lat: 6.2419,
    lng: -62.8567,
    metodoPago: ['Transferencia bancaria', 'Efectivo USD', 'Zelle'],
  },
  {
    slug: 'posada-uruyen',
    nombre: 'Campamento Uruyén',
    destino: 'Canaima',
    destinoSlug: 'canaima',
    tipo: 'Lodge de selva',
    precio: 140,
    habitaciones: 7,
    capacidad: 6,
    rating: 4.9,
    reviews: 15,
    tags: ['Auyantepuy', 'Churún', 'Aventura'],
    descripcion:
      'Un campamento auténtico al pie del Auyantepuy, en el valle de Kamarata. Vuelos panorámicos sobre el tepuy, caminatas a los rápidos de Mayupa y noches estrelladas en la sabana. Operado por familias Pemón de la zona.',
    servicios: ['Pensión completa', 'Vuelo panorámico opcional', 'Guía nativo Pemón', 'Excursiones a saltos', 'Churuata tradicional', 'Hamacas'],
    politicas: ['Check-in: 12:00 PM', 'Check-out: 10:00 AM', 'No se admiten mascotas', 'Sin cancelación (reserva confirmada)'],
    imgs: [IMG.uruyen, IMG.mayupa, IMG.wakuLodge, IMG.kerepa],
    host: { nombre: 'Ángel Pemón', desde: '2016', idiomas: ['Español', 'Pemón', 'Inglés'] },
    reseñas: [
      { autor: 'Klaus M.', pais: 'Austria', rating: 5, texto: 'The Gran Sabana is out of this world. Best adventure of my life.' },
      { autor: 'Sofía R.', pais: 'Buenos Aires, Argentina', rating: 5, texto: 'Uruyén es pura magia. Volar sobre el Auyantepuy es inolvidable.' },
    ],
    lat: 5.7000,
    lng: -62.5000,
    metodoPago: ['Efectivo USD', 'Transferencia bancaria', 'Zelle'],
  },
  {
    slug: 'posada-gran-sabana',
    nombre: 'Posada Tepuy View',
    destino: 'Gran Sabana',
    destinoSlug: 'gran-sabana',
    tipo: 'Lodge de sabana',
    precio: 110,
    habitaciones: 6,
    capacidad: 5,
    rating: 4.9,
    reviews: 18,
    tags: ['Tepuyes', 'Quebrada de Jaspe', 'Aventura'],
    descripcion:
      'En el corazón de la Gran Sabana, frente a los majestuosos tepuyes Kukenán y Roraima. Punto de partida ideal para explorar la Quebrada de Jaspe, los saltos cristalinos y la cultura indígena Pemón en un paisaje de otro planeta.',
    servicios: ['Todo incluido', 'Guía certificado', 'Wi-Fi satelital', 'Transporte 4x4', 'Cocina criolla', 'Equipo de camping'],
    politicas: ['Check-in: 12:00 PM', 'Check-out: 10:00 AM', 'No se admiten mascotas', 'Cancelación gratuita 7 días antes'],
    imgs: [IMG.kukenan, IMG.jape, IMG.guacamaya, IMG.mayupa],
    host: { nombre: 'Daniel Lameda', desde: '2016', idiomas: ['Español', 'Inglés'] },
    reseñas: [
      { autor: 'Klaus M.', pais: 'Austria', rating: 5, texto: 'Los tepuyes en persona son incomparables. La Quebrada de Jaspe es un río de cristal.' },
      { autor: 'Sofía R.', pais: 'Buenos Aires, Argentina', rating: 5, texto: 'Un paisaje que parece de otro planeta. El guía conocía cada rincón.' },
    ],
    lat: 4.6500,
    lng: -61.0833,
    metodoPago: ['Efectivo USD', 'Transferencia bancaria', 'Zelle'],
  },
  {
    slug: 'posada-margarita',
    nombre: 'Posada Isla Bella Margarita',
    destino: 'Isla Margarita',
    destinoSlug: 'isla-margarita',
    tipo: 'Boutique de playa',
    precio: 75,
    habitaciones: 15,
    capacidad: 4,
    rating: 4.5,
    reviews: 112,
    tags: ['Piscina', 'Beach bar', 'Kitesurf'],
    descripcion:
      'En la perla del Caribe venezolano, esta posada combina el encanto tropical con todas las comodidades modernas. A pasos de Playa El Agua, con piscina, beach bar y clases de kitesurf en El Yaque.',
    servicios: ['Piscina', 'Beach bar', 'Wi-Fi', 'Aire acondicionado', 'Estacionamiento', 'Clases de kitesurf'],
    politicas: ['Check-in: 3:00 PM', 'Check-out: 12:00 PM', 'Se admiten mascotas pequeñas', 'Cancelación gratuita 24h antes'],
    imgs: [IMG.playaAgua, IMG.playaIndio, IMG.medina],
    host: { nombre: 'Valentina Cruz', desde: '2016', idiomas: ['Español', 'Inglés', 'Portugués'] },
    reseñas: [
      { autor: 'Andrea G.', pais: 'Miami, EE.UU.', rating: 5, texto: 'La mejor opción calidad-precio en Margarita.' },
      { autor: 'Thomas H.', pais: 'Reino Unido', rating: 4, texto: 'Excellent value for money. The kitesurf classes were top notch.' },
      { autor: 'Gabriela M.', pais: 'Caracas, Venezuela', rating: 5, texto: 'La piscina y el beach bar son increíbles.' },
    ],
    lat: 11.1667,
    lng: -63.8500,
    metodoPago: ['Zelle', 'Efectivo USD', 'Transferencia bancaria', 'Tarjeta'],
  },
  {
    slug: 'posada-medanos-coro',
    nombre: 'Posada Médanos de Coro',
    destino: 'Coro',
    destinoSlug: 'coro',
    tipo: 'Casa colonial',
    precio: 55,
    habitaciones: 8,
    capacidad: 4,
    rating: 4.6,
    reviews: 39,
    tags: ['Dunas', 'Casco colonial', 'Patrimonio'],
    descripcion:
      'Una casa colonial restaurada en Santa Ana de Coro, primer Patrimonio de la Humanidad de Venezuela. A minutos del Parque Nacional Médanos de Coro, donde las dunas de arena dorada crean un desierto a orillas del Caribe.',
    servicios: ['Desayuno incluido', 'Wi-Fi', 'Aire acondicionado', 'Patio colonial', 'Tours a los médanos', 'Estacionamiento'],
    politicas: ['Check-in: 2:00 PM', 'Check-out: 11:00 AM', 'Se admiten mascotas pequeñas', 'Cancelación gratuita 48h antes'],
    imgs: [IMG.medanos, IMG.guacamaya, IMG.playaIndio],
    host: { nombre: 'Elena Morales', desde: '2019', idiomas: ['Español'] },
    reseñas: [
      { autor: 'Ricardo P.', pais: 'Valencia, Venezuela', rating: 5, texto: 'El casco colonial de Coro es hermoso y los médanos al atardecer son mágicos.' },
      { autor: 'Marta G.', pais: 'Colombia', rating: 4, texto: 'Elena hace que te sientas como en casa. Una joya del occidente venezolano.' },
    ],
    lat: 11.4045,
    lng: -69.6733,
    metodoPago: ['Efectivo USD', 'Efectivo Bs', 'Pago Móvil', 'Transferencia bancaria'],
  },
]

export const destinos: Destino[] = [
  {
    slug: 'los-roques',
    nombre: 'Los Roques',
    tagline: 'Archipiélago',
    descripcion: 'Descubre posadas auténticas en el archipiélago de Los Roques, con aguas turquesa, cayos desiertos y una experiencia cálida conectada con el mar.',
    hero: IMG.roquesHero,
    posadaSlugs: ['posada-sol-roques', 'posada-cayo-agua'],
  },
  {
    slug: 'merida',
    nombre: 'Mérida',
    tagline: 'Los Andes',
    descripcion: 'Encuentra posadas acogedoras en Mérida, rodeadas de montaña, páramo y la hospitalidad andina más auténtica.',
    hero: IMG.guacamaya,
    posadaSlugs: ['posada-los-andes'],
  },
  {
    slug: 'mochima',
    nombre: 'Mochima',
    tagline: 'Costa Oriental',
    descripcion: 'Explora posadas en Mochima y la costa de Sucre para una experiencia frente al mar, entre playas vírgenes, cocoteros y tranquilidad.',
    hero: IMG.medina,
    posadaSlugs: ['posada-mochima-azul', 'posada-playa-medina'],
  },
  {
    slug: 'morrocoy',
    nombre: 'Morrocoy',
    tagline: 'Costa Occidental',
    descripcion: 'Descubre posadas en Morrocoy para disfrutar de cayos increíbles, buceo y atardeceres sobre el manglar.',
    hero: IMG.cayoSombrero,
    posadaSlugs: ['posada-morrocoy'],
  },
  {
    slug: 'canaima',
    nombre: 'Canaima',
    tagline: 'Salto Ángel',
    descripcion: 'Hospédate frente a la laguna de Canaima y el Salto Ángel, uno de los destinos más extraordinarios del planeta, con una experiencia auténtica Pemón.',
    hero: IMG.canaimaLodge,
    posadaSlugs: ['posada-canaima', 'posada-uruyen'],
  },
  {
    slug: 'gran-sabana',
    nombre: 'Gran Sabana',
    tagline: 'Tierra de tepuyes',
    descripcion: 'Posadas y campamentos en la Gran Sabana, entre tepuyes milenarios, ríos de jaspe y la cultura indígena Pemón.',
    hero: IMG.kukenan,
    posadaSlugs: ['posada-gran-sabana'],
  },
  {
    slug: 'isla-margarita',
    nombre: 'Isla Margarita',
    tagline: 'Caribe',
    descripcion: 'Encuentra posadas boutique en Isla Margarita para una experiencia relajada, tropical y memorable junto a Playa El Agua.',
    hero: IMG.playaAgua,
    posadaSlugs: ['posada-margarita'],
  },
  {
    slug: 'coro',
    nombre: 'Coro',
    tagline: 'Dunas & Colonial',
    descripcion: 'Posadas en Santa Ana de Coro, Patrimonio de la Humanidad, a minutos de los médanos de arena dorada a orillas del Caribe.',
    hero: IMG.medanos,
    posadaSlugs: ['posada-medanos-coro'],
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
