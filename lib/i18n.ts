// Idiomas de la web pública. El idioma vive en la cookie `lang` (la lee el servidor
// para que cada página salga ya traducida, sin parpadeo).
//
// Uso: envolver cualquier texto en español con t('…'). Si el idioma es inglés se busca
// la traducción en EN (lib/i18n-en.ts); si falta, se muestra el español.
// Variables: t('{n} posadas', { n: 3 }).
import { EN } from './i18n-en'

export type Lang = 'es' | 'en'
export const LANGS: Lang[] = ['es', 'en']
export const LANG_COOKIE = 'lang'

export function isLang(v: unknown): v is Lang {
  return v === 'es' || v === 'en'
}

export type T = (es: string, vars?: Record<string, string | number>) => string

export function makeT(lang: Lang): T {
  return (es, vars) => {
    let s = lang === 'en' ? (EN[es] ?? es) : es
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v))
    return s
  }
}

// Locale para fechas y números.
export const LOCALE: Record<Lang, string> = { es: 'es-VE', en: 'en-US' }
