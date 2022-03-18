import { DEFAULT_LOCALE } from '@algomart/schemas'
import { useState } from 'react'

export function useLocale() {
  const [locale, setLocale] = useState<string>()

  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE
  } else {
    window.addEventListener('languagechange', () => {
      setLocale(navigator?.language)
    })

    if (locale !== navigator.language) {
      setLocale(navigator?.language)
    }
  }

  return locale || DEFAULT_LOCALE
}
