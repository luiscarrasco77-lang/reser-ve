// Canales de donde vienen las reservas de una posada (para el calendario y las estadísticas).
export const CHANNELS: { key: string; label: string; color: string }[] = [
  { key: 'whatsapp', label: 'WhatsApp', color: '#25A35A' },
  { key: 'instagram', label: 'Instagram', color: '#C13584' },
  { key: 'facebook', label: 'Facebook', color: '#1877F2' },
  { key: 'telefono', label: 'Teléfono', color: '#5B6B82' },
  { key: 'presencial', label: 'En persona', color: '#8A6D3B' },
  { key: 'booking', label: 'Booking', color: '#003580' },
  { key: 'airbnb', label: 'Airbnb', color: '#FF385C' },
  { key: 'expedia', label: 'Expedia', color: '#E6A700' },
  { key: 'google', label: 'Google Calendar', color: '#4285F4' },
  { key: 'agencia', label: 'Agencia u operador', color: '#7B4FA0' },
  { key: 'otro', label: 'Otro', color: '#7A8699' },
  { key: 'cerrado', label: 'Cerrada', color: '#1A2B4C' },
  { key: 'reserve', label: 'RESER-VE', color: '#E67E22' },
]
export const CHANNEL_KEYS = CHANNELS.map(c => c.key)
export const channel = (key: string) => CHANNELS.find(c => c.key === key) ?? { key, label: key, color: '#7A8699' }

// Calendarios iCal que se pueden conectar (nombre visible → canal).
export const FEED_CHANNELS = ['booking', 'airbnb', 'expedia', 'google', 'otro']
