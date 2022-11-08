import { FirebaseClaim } from '@algomart/schemas'
import { Forbidden, Unauthorized } from 'http-errors'
import { NextApiResponse } from 'next'
import { RequestHandler } from 'next-connect'

import { NextApiRequestApp } from './types'

import configureAdmin from '@/clients/firebase-admin-client'

export function adminMiddleware(): RequestHandler<
  NextApiRequestApp,
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

      // If the user is not admin, throw an error
      const isAdminUser = claims?.[FirebaseClaim.admin]
      if (!isAdminUser) {
        throw new Forbidden('User does not have admin permissions')
      }

      request.isAdmin = true
      next()
    } catch (error) {
      next(error)
    }
  }
}
