import { cookies } from 'next/headers'
import { isLang, LANG_COOKIE, makeT, type Lang } from './i18n'

// Idioma actual en componentes de servidor (layouts, páginas, metadata).
export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value
  return isLang(v) ? v : 'es'
}

export async function getT() {
  return makeT(await getLang())
}

// Instrucción de idioma para los asistentes de IA (Chigüi y Aurora).
export function aiLanguageNote(lang: 'es' | 'en') {
  return lang === 'en'
    ? '\n\n# Idioma\nEl usuario está viendo la web en INGLÉS: responde en inglés natural (salvo que te escriba en otro idioma; entonces usa el suyo). Los nombres de posadas, destinos y la marca RESER-VE no se traducen.'
    : '\n\n# Idioma\nResponde en el idioma en que te escriba el usuario (por defecto, español).'
}
