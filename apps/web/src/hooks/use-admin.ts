import { FirebaseClaim } from '@algomart/schemas'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { useAuth } from '@/contexts/auth-context'
import adminService from '@/services/admin-service'
import { urls } from '@/utils/urls'

interface IUseAdmin {
  redirectIfNotAdmin?: boolean
}

export default function useAdmin({
  redirectIfNotAdmin = false,
}: IUseAdmin = {}) {
  const auth = useAuth()
  const router = useRouter()
  const [claims, setClaims] = useState([])

  useEffect(() => {
    const checkClaims = async () => {
      try {
        const { claims } = await adminService.getLoggedInUserPermissions()
        setClaims(claims)
        // If there is no admin role, throw error
        if (!claims || !claims.includes(FirebaseClaim.admin)) {
          throw new Error('User is not admin')
        }
      } catch {
        if (redirectIfNotAdmin) {
          router.push(urls.home)
        }
      }
    }

    // Check permissions on page render, after auth token is refreshed so claims are fresh
    if (auth.user) {
      checkClaims()
    }
  }, [auth?.user, router])

  return {
    isAdmin: (claims || []).includes(FirebaseClaim.admin),
    claims: claims,
  }
}
