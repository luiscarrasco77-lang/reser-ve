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

export type PolicyState = { values: Record<string, string>; otras: string }

// Separa las políticas guardadas en opciones conocidas y texto libre.
export function parsePolicies(list: string[]): PolicyState {
  const values: Record<string, string> = {}
  const otras: string[] = []
  for (const raw of list) {
    const p = raw.trim()
    if (!p) continue
    const f = POLICY_FIELDS.find(f => !values[f.key] && f.options.includes(p))
    if (f) values[f.key] = p
    else otras.push(p)
  }
  return { values, otras: otras.join('\n') }
}

export function buildPolicies(s: PolicyState): string[] {
  const out = POLICY_FIELDS.map(f => s.values[f.key]).filter(Boolean) as string[]
  return [...out, ...s.otras.split('\n').map(x => x.trim()).filter(Boolean)]
}

// Traducciones al inglés de todas las opciones (para la ficha en inglés).
export const POLICY_EN: Record<string, string> = {
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
