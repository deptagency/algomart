import { CURRENCY_COOKIE, LANG_COOKIE } from '@algomart/schemas'
import Cookies from 'js-cookie'

export function setCookie(name: string, value: string, expiresInDays: number) {
  const expires = new Date()
  expires.setDate(expires.getDate() + expiresInDays)
  Cookies.set(name, value, { expires, sameSite: 'Lax' })
}

export function getCookie(name: string): string | undefined {
  return Cookies.get(name)
}

export function removeCookie(name: string) {
  Cookies.remove(name, { expires: 0, sameSite: 'Lax' })
}

export function setCurrencyCookie(currency: string) {
  setCookie(CURRENCY_COOKIE, currency, 365)
}

export function setLanguageCookie(language: string) {
  setCookie(LANG_COOKIE, language, 365)
}

const IGNORE_VALUES = new Set(['null', 'undefined'])

export function safeGetCookie(name: string) {
  const value = getCookie(name)
  if (value && !IGNORE_VALUES.has(value)) {
    return value
  }
  return null
}
