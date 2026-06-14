'use client'

import React from 'react'

// Renderiza texto plano con un subconjunto mínimo de markdown:
// **negrita** y saltos de línea. Evita mostrar los asteriscos crudos
// que devuelve el modelo de IA.
export default function RichText({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, li) => (
        <React.Fragment key={li}>
          {renderBold(line)}
          {li < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </>
  )
}

function renderBold(line: string) {
  // Divide por **...**; los segmentos impares van en negrita.
  const parts = line.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <React.Fragment key={i}>{part}</React.Fragment>,
  )
}
