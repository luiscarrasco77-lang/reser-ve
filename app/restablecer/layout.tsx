import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nueva contraseña',
  description: 'Crea una nueva contraseña para tu cuenta de RESER-VE.',
  robots: { index: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
