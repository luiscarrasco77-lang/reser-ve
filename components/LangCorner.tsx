'use client'

import LangSwitch from './LangSwitch'

// Selector de idioma flotante arriba a la derecha, para páginas sin barra de navegación
// (inicio de sesión, registro, recuperar contraseña…).
export default function LangCorner() {
  return (
    <div style={{ position: 'fixed', top: 'calc(var(--pp-h, 0px) + 14px)', right: 16, zIndex: 300 }}>
      <LangSwitch />
    </div>
  )
}
