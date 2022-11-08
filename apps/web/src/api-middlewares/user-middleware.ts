import { BadRequest, Unauthorized } from 'http-errors'
import { NextApiResponse } from 'next'
import { RequestHandler } from 'next-connect'

import { NextApiRequestApp } from './types'

import { ApiClient } from '@/clients/api-client'
import { AppConfig } from '@/config'
import getBearerToken from '@/utils/get-bearer-token'

/**
 * Require req.user to be set
 */
export function userMiddleware(): RequestHandler<
  NextApiRequestApp,
  NextApiResponse
> {
  return async (request, _response, next) => {
    try {
      if (!request.token) {
        // Ensures correct usage
        throw new Unauthorized()
      }

      const client = new ApiClient(AppConfig.apiURL, getBearerToken(request))
      const user = await client.getAccountProfile()

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
