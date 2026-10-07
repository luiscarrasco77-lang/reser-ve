// Mensaje predeterminado que el posadero envía al huésped al confirmar una reserva
// (como los "mensajes programados" de Airbnb). Se guarda por posada y admite variables.

export const CONFIRM_VARS: { key: string; label: string }[] = [
  { key: 'huesped', label: 'Nombre del huésped' },
  { key: 'posada', label: 'Nombre de la posada' },
  { key: 'llegada', label: 'Fecha de llegada' },
  { key: 'salida', label: 'Fecha de salida' },
  { key: 'noches', label: 'Noches' },
  { key: 'huespedes', label: 'Número de huéspedes' },
  { key: 'total', label: 'Total en USD' },
  { key: 'metodo', label: 'Método de pago' },
  { key: 'codigo', label: 'Código de reserva' },
]

export const DEFAULT_CONFIRM_MESSAGE = `¡Hola {huesped}! 🎉 Tu reserva en {posada} está confirmada.

📅 Llegada: {llegada}
📅 Salida: {salida} ({noches} noches)
🔖 Código: {codigo}

Para completar el pago de {total} USD por {metodo}, en un momento te envío mis datos por este chat. Paga solo a los datos que recibas aquí.

Cuéntame a qué hora piensas llegar y si necesitas algo (traslados, comidas, recomendaciones). ¡Te esperamos!`

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
function fecha(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return y && m && d ? `${d} de ${MONTHS[m - 1]} de ${y}` : iso
}

export type ConfirmData = {
  huesped: string; posada: string; checkIn: string; checkOut: string; nights: number
  guests: number; total: number; metodo: string | null; codigo: string
}

export function renderConfirmMessage(template: string, b: ConfirmData): string {
  const vars: Record<string, string> = {
    huesped: b.huesped.split(' ')[0] || b.huesped,
    posada: b.posada,
    llegada: fecha(b.checkIn),
    salida: fecha(b.checkOut),
    noches: String(b.nights),
    huespedes: String(b.guests),
    total: String(b.total),
    metodo: b.metodo || 'el método acordado',
    codigo: b.codigo,
  }
  return template.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m)
}
