import { useRouter } from 'next/router'
import { useEffect, useRef } from 'react'

import { useAuth } from '@/contexts/auth-context'
import { urls } from '@/utils/urls'

export function SetupRedirectGuard({ children }) {
  const {
    isNeedsSetup,
    isAuthenticating,
    isAuthenticated,
    status,
    setRedirectPath,
  } = useAuth(false)
  const { route, push } = useRouter()
  const didInitialize = useRef(false)

  useEffect(() => {
    // If the user authenticates through a provider other than Email but hasn't set up their profile, make them do so
    if (isNeedsSetup && !route.includes(urls.myProfileSetup)) {
      setRedirectPath(route)
      push(urls.myProfileSetup)
    } else if (
      !isAuthenticating &&
      !isAuthenticated &&
      status !== 'error' &&
      !didInitialize.current
    ) {
      didInitialize.current = true
    }
  }, [isNeedsSetup, status, route]) // eslint-disable-line react-hooks/exhaustive-deps

  return children
}
