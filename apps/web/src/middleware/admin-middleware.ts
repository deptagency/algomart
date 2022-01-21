import { FirebaseClaim } from '@algomart/schemas'
import { Unauthorized } from 'http-errors'
import { NextApiRequest, NextApiResponse } from 'next'
import { RequestHandler } from 'next-connect'

import configureAdmin from '@/clients/firebase-admin-client'
import { Environment } from '@/environment'
import { WithToken } from '@/middleware/auth-middleware'
import { WithUser } from '@/middleware/user-middleware'

export type WithAdminPermission = {
  isAdmin: boolean
}

export default function adminMiddleware(): RequestHandler<
  NextApiRequest & WithAdminPermission & Partial<WithUser> & Partial<WithToken>,
  NextApiResponse
> {
  return async (request, _, next) => {
    try {
      if (!request.token || !request.user) {
        throw new Unauthorized()
      }

      // Check the verified claims of the token include admin permissions
      const admin = configureAdmin()
      const firebaseUser = await admin.auth().getUser(request.user.externalId)
      const claims = firebaseUser.customClaims

      // If the user is not admin OR the logged in user isn't the admin email, throw error
      const isAdminUser =
        !!claims && Object.keys(claims).includes(FirebaseClaim.admin)
      const isLoggedInAdminUser =
        Environment.firebaseAdminEmail === request.user.email
      if (!isAdminUser && !isLoggedInAdminUser) {
        throw new Unauthorized('User does not have admin permissions')
      }

      request.isAdmin = true
      next()
    } catch (error) {
      next(error)
    }
  }
}
