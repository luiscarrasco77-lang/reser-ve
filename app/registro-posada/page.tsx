import { redirect } from 'next/navigation'

// El antiguo formulario de solicitud se reemplazó por el alta directa como posadero.
export default function RegistroPosadaPage() {
  redirect('/register?role=host')
}
