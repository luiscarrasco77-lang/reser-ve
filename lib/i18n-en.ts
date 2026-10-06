// Traducciones al inglés, por sección. La clave es el texto original en español.
import { common } from './en/common'
import { catalog } from './en/catalog'
import { auth } from './en/auth'
import { buscar } from './en/buscar'
import { chat } from './en/chat'
import { components } from './en/components'
import { ficha } from './en/ficha'
import { home } from './en/home'
import { info } from './en/info'
import { legal } from './en/legal'
import { meta } from './en/meta'
import { reserva } from './en/reserva'
import { unify } from './en/unify'
import { viajero } from './en/viajero'
import { POLICY_EN } from './policies'

export const EN: Record<string, string> = {
  ...common,
  ...catalog,
  ...auth,
  ...buscar,
  ...chat,
  ...components,
  ...ficha,
  ...home,
  ...info,
  ...legal,
  ...meta,
  ...reserva,
  ...unify,
  ...viajero,
  ...POLICY_EN,
}
