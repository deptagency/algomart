import { Unauthorized } from 'http-errors'
import { NextApiResponse } from 'next'
import { RequestHandler } from 'next-connect'

import { NextApiRequestApp } from './types'

import configureAdmin from '@/clients/firebase-admin-client'
import getBearerToken from '@/utils/get-bearer-token'

export function authMiddleware(): RequestHandler<
  NextApiRequestApp,
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
