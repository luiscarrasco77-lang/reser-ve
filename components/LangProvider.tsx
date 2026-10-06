'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LANG_COOKIE, makeT, type Lang, type T } from '@/lib/i18n'

const Ctx = createContext<{ lang: Lang; t: T; setLang: (l: Lang) => void }>({
  lang: 'es', t: makeT('es'), setLang: () => {},
})

export function LangProvider({ lang: initial, children }: { lang: Lang; children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial)
  const router = useRouter()
  const setLang = useCallback((l: Lang) => {
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`
    document.documentElement.lang = l
    setLangState(l)
    router.refresh() // vuelve a pintar las partes de servidor en el nuevo idioma
  }, [router])
  const value = useMemo(() => ({ lang, t: makeT(lang), setLang }), [lang, setLang])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLang() {
  return useContext(Ctx)
}

// Atajo: const t = useT()
export function useT() {
  return useContext(Ctx).t
}
