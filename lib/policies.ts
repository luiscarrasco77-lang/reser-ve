// Políticas predeterminadas para el formulario de posadas (al estilo de Airbnb y Booking).
// Se guardan como frases normales en `politicas` (string[]), así la ficha no cambia y
// las frases conocidas se pueden traducir al inglés. Lo que no coincide con ninguna
// opción va a "Otras políticas".

export type PolicyField = {
  key: string
  label: string
  options: string[] // la primera opción ('') es "sin especificar"
}

const HOURS_IN = ['11:00 am', '12:00 pm', '1:00 pm', '2:00 pm', '3:00 pm', '4:00 pm', '5:00 pm', '6:00 pm']
const HOURS_OUT = ['8:00 am', '9:00 am', '10:00 am', '11:00 am', '12:00 pm', '1:00 pm', '2:00 pm']

export const POLICY_FIELDS: PolicyField[] = [
  { key: 'checkin', label: 'Check-in', options: ['', ...HOURS_IN.map(h => `Check-in desde las ${h}`), 'Check-in flexible (coordinar por el chat)'] },
  { key: 'checkout', label: 'Check-out', options: ['', ...HOURS_OUT.map(h => `Check-out hasta las ${h}`), 'Check-out flexible (coordinar por el chat)'] },
  { key: 'cancelacion', label: 'Cancelación', options: [
    '',
    'Cancelación gratis hasta 24 h antes de la llegada',
    'Cancelación gratis hasta 48 h antes de la llegada',
    'Cancelación gratis hasta 72 h antes de la llegada',
    'Cancelación gratis hasta 7 días antes de la llegada',
    'Cancelación gratis hasta 14 días antes de la llegada',
    'Cancelación gratis hasta 72 h antes; después se cobra el 50%',
    'Cancelación gratis hasta 72 h antes; entre 72 y 24 h se cobra el 50%; con menos de 24 h, el 100%',
    'Cancelación gratis hasta 48 h antes; entre 48 y 24 h se cobra el 50%; con menos de 24 h, el 100%',
    'Cancelación gratis hasta 7 días antes; después se cobra el 50%',
    'Reembolso del 50% si cancelas hasta 7 días antes; después no hay reembolso',
    'No reembolsable',
  ] },
  { key: 'pago', label: 'Pago y anticipo', options: [
    '',
    'Se paga el 100% al confirmar la reserva',
    'Se paga un anticipo del 50% al confirmar y el resto al llegar',
    'Se paga un anticipo del 30% al confirmar y el resto al llegar',
    'Se paga el total al llegar a la posada',
  ] },
  { key: 'mascotas', label: 'Mascotas', options: ['', 'Se admiten mascotas', 'Se admiten mascotas pequeñas', 'Mascotas bajo consulta', 'No se admiten mascotas'] },
  { key: 'ninos', label: 'Niños', options: ['', 'Niños bienvenidos', 'Niños menores de 3 años no pagan', 'Niños menores de 6 años no pagan', 'Solo adultos (mayores de 18 años)'] },
  { key: 'fumar', label: 'Fumar', options: ['', 'No se permite fumar', 'Solo se permite fumar en áreas exteriores', 'Se permite fumar'] },
  { key: 'fiestas', label: 'Fiestas y eventos', options: ['', 'No se permiten fiestas ni eventos', 'Eventos solo con autorización previa', 'Se permiten eventos'] },
  { key: 'silencio', label: 'Horas de silencio', options: ['', 'Horas de silencio desde las 10:00 pm', 'Horas de silencio desde las 11:00 pm', 'Horas de silencio desde las 12:00 am'] },
  { key: 'visitas', label: 'Visitas', options: ['', 'No se permiten visitas de personas no registradas', 'Visitas solo con autorización previa'] },
  { key: 'documento', label: 'Identificación', options: ['', 'Se requiere documento de identidad al llegar', 'Se requiere documento de identidad de todos los huéspedes'] },
]


// Extras de selección múltiple (al estilo de "Reglas de la casa", "Seguridad y propiedad"
// y "Servicios" de Airbnb/Booking). Español → inglés.
export const POLICY_EXTRAS: { group: string; items: [string, string][] }[] = [
  { group: 'Reglas de la casa', items: [
    ['Prohibido el ingreso de bebidas alcohólicas', 'No outside alcoholic drinks'],
    ['Respetar el número máximo de huéspedes', 'Maximum number of guests must be respected'],
    ['No se permite la fotografía comercial sin autorización', 'No commercial photography without permission'],
    ['Se pide cuidar el agua y la electricidad', 'Please be mindful of water and electricity use'],
    ['Apagar el aire acondicionado al salir de la habitación', 'Turn off the air conditioning when leaving the room'],
    ['No se permite cocinar en las habitaciones', 'No cooking in the rooms'],
    ['Se pide quitarse el calzado en las áreas interiores', 'Please remove shoes indoors'],
    ['Las toallas de la habitación no se llevan a la playa', 'Room towels may not be taken to the beach'],
    ['Reciclaje y separación de basura', 'Recycling and waste separation'],
    ['Al salir: entregar la llave y dejar la basura en su lugar', 'On check-out: return the key and leave the trash in place'],
  ] },
  { group: 'Seguridad y propiedad', items: [
    ['Piscina sin cerca ni reja', 'Pool without a fence or gate'],
    ['Cerca de agua: mar, río o laguna', 'Near water: sea, river or lagoon'],
    ['Escaleras o zonas en altura sin baranda', 'Stairs or heights without railings'],
    ['Animales en la propiedad', 'Animals on the property'],
    ['Cámaras de seguridad en áreas comunes', 'Security cameras in common areas'],
    ['Vigilancia o seguridad privada', 'Private security on site'],
    ['Detector de humo', 'Smoke detector'],
    ['Extintor', 'Fire extinguisher'],
    ['Botiquín de primeros auxilios', 'First aid kit'],
    ['Caja fuerte en la habitación', 'In-room safe'],
    ['Zona sin señal de teléfono o con internet limitado', 'Limited phone signal or internet'],
  ] },
  { group: 'Servicios y energía', items: [
    ['Planta eléctrica para cortes de luz', 'Backup generator for power cuts'],
    ['Tanque de agua de respaldo', 'Backup water tank'],
    ['Agua caliente', 'Hot water'],
    ['Ropa de cama y toallas incluidas', 'Bed linen and towels included'],
    ['Limpieza diaria', 'Daily cleaning'],
    ['Desayuno incluido en el precio', 'Breakfast included in the price'],
    ['Desayuno con costo adicional', 'Breakfast at extra cost'],
    ['Comidas por encargo', 'Meals on request'],
    ['Traslado desde el aeropuerto o terminal con costo adicional', 'Airport or bus terminal transfer at extra cost'],
    ['Estacionamiento gratuito', 'Free parking'],
    ['Cuna disponible a pedido', 'Crib available on request'],
    ['Cama adicional con costo extra', 'Extra bed at additional cost'],
    ['Tours y excursiones a pedido', 'Tours and excursions on request'],
    ['Se aceptan pagos en dólares y bolívares', 'Payments accepted in dollars and bolívars'],
  ] },
  { group: 'Llegada y salida', items: [
    ['Llegada temprana según disponibilidad', 'Early check-in subject to availability'],
    ['Salida tardía según disponibilidad', 'Late check-out subject to availability'],
    ['Recepción las 24 horas', '24-hour reception'],
    ['El anfitrión recibe en persona', 'The host welcomes you in person'],
    ['Llegada autónoma con llaves en caja de seguridad', 'Self check-in with lockbox'],
    ['Avisar la hora de llegada por el chat', 'Let us know your arrival time in the chat'],
    ['Acceso por carretera de tierra o en 4x4', 'Access by dirt road or 4x4'],
    ['Acceso solo en lancha', 'Access by boat only'],
    ['Acceso en avioneta', 'Access by small plane'],
  ] },
]
const EXTRA_SET = new Set(POLICY_EXTRAS.flatMap(g => g.items.map(([es]) => es)))

export type PolicyState = { values: Record<string, string>; extras: string[]; otras: string }

// Separa las políticas guardadas en opciones conocidas y texto libre.
export function parsePolicies(list: string[]): PolicyState {
  const values: Record<string, string> = {}
  const extras: string[] = []
  const otras: string[] = []
  for (const raw of list) {
    const p = raw.trim()
    if (!p) continue
    const f = POLICY_FIELDS.find(f => !values[f.key] && f.options.includes(p))
    if (f) values[f.key] = p
    else if (EXTRA_SET.has(p)) extras.push(p)
    else otras.push(p)
  }
  return { values, extras, otras: otras.join('\n') }
}

export function buildPolicies(s: PolicyState): string[] {
  const out = POLICY_FIELDS.map(f => s.values[f.key]).filter(Boolean) as string[]
  const extras = POLICY_EXTRAS.flatMap(g => g.items.map(([es]) => es)).filter(e => s.extras.includes(e))
  return [...out, ...extras, ...s.otras.split('\n').map(x => x.trim()).filter(Boolean)]
}

// Traducciones al inglés de todas las opciones (para la ficha en inglés).
export const POLICY_EN: Record<string, string> = {
  ...Object.fromEntries(POLICY_EXTRAS.flatMap(g => g.items)),
  ...Object.fromEntries(HOURS_IN.map(h => [`Check-in desde las ${h}`, `Check-in from ${h}`])),
  ...Object.fromEntries(HOURS_OUT.map(h => [`Check-out hasta las ${h}`, `Check-out until ${h}`])),
  'Check-in flexible (coordinar por el chat)': 'Flexible check-in (arrange in the chat)',
  'Check-out flexible (coordinar por el chat)': 'Flexible check-out (arrange in the chat)',
  'Cancelación gratis hasta 24 h antes de la llegada': 'Free cancellation up to 24 h before arrival',
  'Cancelación gratis hasta 48 h antes de la llegada': 'Free cancellation up to 48 h before arrival',
  'Cancelación gratis hasta 72 h antes de la llegada': 'Free cancellation up to 72 h before arrival',
  'Cancelación gratis hasta 7 días antes de la llegada': 'Free cancellation up to 7 days before arrival',
  'Cancelación gratis hasta 14 días antes de la llegada': 'Free cancellation up to 14 days before arrival',
  'Cancelación gratis hasta 72 h antes; después se cobra el 50%': 'Free cancellation up to 72 h before; after that, 50% is charged',
  'Cancelación gratis hasta 72 h antes; entre 72 y 24 h se cobra el 50%; con menos de 24 h, el 100%': 'Free cancellation up to 72 h before; 50% charged between 72 and 24 h; 100% with less than 24 h',
  'Cancelación gratis hasta 48 h antes; entre 48 y 24 h se cobra el 50%; con menos de 24 h, el 100%': 'Free cancellation up to 48 h before; 50% charged between 48 and 24 h; 100% with less than 24 h',
  'Cancelación gratis hasta 7 días antes; después se cobra el 50%': 'Free cancellation up to 7 days before; after that, 50% is charged',
  'Reembolso del 50% si cancelas hasta 7 días antes; después no hay reembolso': '50% refund if you cancel up to 7 days before; no refund after that',
  'No reembolsable': 'Non-refundable',
  'Se paga el 100% al confirmar la reserva': '100% is paid when the booking is confirmed',
  'Se paga un anticipo del 50% al confirmar y el resto al llegar': '50% deposit when confirmed, the rest on arrival',
  'Se paga un anticipo del 30% al confirmar y el resto al llegar': '30% deposit when confirmed, the rest on arrival',
  'Se paga el total al llegar a la posada': 'Full payment on arrival at the posada',
  'Se admiten mascotas': 'Pets allowed',
  'Se admiten mascotas pequeñas': 'Small pets allowed',
  'Mascotas bajo consulta': 'Pets on request',
  'No se admiten mascotas': 'No pets allowed',
  'Niños bienvenidos': 'Children welcome',
  'Niños menores de 3 años no pagan': 'Children under 3 stay free',
  'Niños menores de 6 años no pagan': 'Children under 6 stay free',
  'Solo adultos (mayores de 18 años)': 'Adults only (18+)',
  'No se permite fumar': 'No smoking',
  'Solo se permite fumar en áreas exteriores': 'Smoking only in outdoor areas',
  'Se permite fumar': 'Smoking allowed',
  'No se permiten fiestas ni eventos': 'No parties or events',
  'Eventos solo con autorización previa': 'Events only with prior approval',
  'Se permiten eventos': 'Events allowed',
  'Horas de silencio desde las 10:00 pm': 'Quiet hours from 10:00 pm',
  'Horas de silencio desde las 11:00 pm': 'Quiet hours from 11:00 pm',
  'Horas de silencio desde las 12:00 am': 'Quiet hours from 12:00 am',
  'No se permiten visitas de personas no registradas': 'No visits from unregistered guests',
  'Visitas solo con autorización previa': 'Visitors only with prior approval',
  'Se requiere documento de identidad al llegar': 'ID required at check-in',
  'Se requiere documento de identidad de todos los huéspedes': 'ID required for all guests',
}
