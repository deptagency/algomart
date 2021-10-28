import admin from 'firebase-admin'
import { Unauthorized } from 'http-errors'
import { NextApiRequest, NextApiResponse } from 'next'
import { RequestHandler } from 'next-connect'

import configureAdmin from '@/clients/firebase-admin-client'
import getBearerToken from '@/utils/get-bearer-token'

export type WithToken = {
  token: admin.auth.DecodedIdToken
}

export default function authMiddleware(): RequestHandler<
  NextApiRequest & WithToken,
  NextApiResponse
> {
  return async (request, _, next) => {
    try {
      const idToken = getBearerToken(request)
      if (!idToken) {
        throw new Unauthorized()
      }

      const token = await configureAdmin().auth().verifyIdToken(idToken)
      request.token = token
      next()
    } catch (error) {
      next(error)
    }
  }
}
