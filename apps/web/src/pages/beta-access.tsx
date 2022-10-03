import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { setCookie } from '@/utils/cookies-web'
import { urls } from '@/utils/urls'

export default function BetaAccessPage() {
  const { query, isReady } = useRouter()

  // Temporary password block
  useEffect(() => {
    if (!isReady) return

    const accessCode = window.prompt('Access Code: ')
    setCookie('algoFanSettings', accessCode, 1)

    if (query?.redirect && typeof query.redirect === 'string') {
      globalThis.window.location.replace(decodeURIComponent(query.redirect))
    } else {
      globalThis.window.location.replace(urls.home)
    }
  }, [isReady]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
