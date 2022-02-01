import { FirebaseClaim } from '@algomart/schemas'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useAuth } from '@/contexts/auth-context'
import adminService from '@/services/admin-service'
import { urls } from '@/utils/urls'

/** Redirect non-admin users to home */
export default function useAdminGate() {
  const auth = useAuth()
  const router = useRouter()

  useEffect(() => {
    const verifyAdminUser = async () => {
      try {
        const { claims } = await adminService.getLoggedInUserPermissions()
        // If there is no admin role, throw error
        if (!claims || !claims.includes(FirebaseClaim.admin)) {
          throw new Error('User is not admin')
        }
      } catch (error) {
        console.error(error)
        router.push(urls.home)
      }
    }

    // Check permissions on page render, after auth token is refreshed so claims are fresh
    if (auth.user) {
      verifyAdminUser()
    }
  }, [auth?.user, router])

  return null
}
