import { PublicAccount } from '@algomart/schemas'
import { BadRequest, Unauthorized } from 'http-errors'
import { NextApiRequest, NextApiResponse } from 'next'
import { RequestHandler } from 'next-connect'

import { WithToken } from './auth-middleware'

import { ApiClient } from '@/clients/api-client'

export type WithUser = {
  user: PublicAccount
}

/**
 * Require req.user to be set
 */
export default function userMiddleware(): RequestHandler<
  NextApiRequest & WithUser & Partial<WithToken>,
  NextApiResponse
> {
  return async (request, _response, next) => {
    try {
      if (!request.token) {
        // Ensures correct usage
        throw new Unauthorized()
      }

      const user = await ApiClient.instance.getAccountByExternalId(
        request.token.uid
      )

      if (!user) {
        // Ensures the user has configured their profile before attempting this request
        throw new BadRequest('Profile not found')
      }

      request.user = user
      next()
    } catch (error) {
      next(error)
    }
  }
}
