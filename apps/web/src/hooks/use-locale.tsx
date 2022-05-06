import { DEFAULT_LOCALE } from '@algomart/schemas'
import { useEffect, useState } from 'react'

export function useLocale() {
  const [locale, setLocale] = useState(DEFAULT_LOCALE)

  useEffect(() => {
    const callback = () => {
      setLocale(navigator.language)
    }

    setLocale(navigator.language)
    window.addEventListener('languagechange', callback)

    return () => {
      window.removeEventListener('languagechange', callback)
    }
  }, [])

  return locale
}
