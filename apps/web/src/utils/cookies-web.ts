import Cookies from 'js-cookie'

export function setCookie(name: string, value: string, expiresInDays: number) {
  const expires = new Date()
  expires.setDate(expires.getDate() + expiresInDays)
  Cookies.set(name, value, { expires, sameSite: 'Strict' })
}

export function getCookie(name: string): string | undefined {
  return Cookies.get(name)
}

export function removeCookie(name: string) {
  Cookies.remove(name)
}
