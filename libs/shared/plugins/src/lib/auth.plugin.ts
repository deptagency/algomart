import { UserAccount } from '@algomart/schemas'
import { UserAccountModel } from '@algomart/shared/models'
import { invariant, userInvariant } from '@algomart/shared/utils'
import { FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { app } from 'firebase-admin'
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier'

declare module 'fastify' {
  interface FastifyInstance {
    requireAuth: () => (request: FastifyRequest) => Promise<void>
  }

  interface FastifyContextConfig {
    auth?: {
      anonymous?: boolean
      tokenOnly?: boolean
    }
    [key: string]: unknown
  }

  interface FastifyRequest {
    user?: UserAccount
    token?: DecodedIdToken
  }
}

export function extractBearerToken(authorizationHeader: string) {
  const pattern = /^bearer\s+(\S*)/i
  const match = authorizationHeader.match(pattern)
  if (!match) return null
  return match[1]
}

export function parseJwt(token: string) {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
  } catch {
    return null
  }
}

export interface FastifyAuthPluginOptions {
  firebase: app.App
  isTest?: boolean
}

export const fastifyAuthPlugin = fp<FastifyAuthPluginOptions>(
  async function fastifyAuthPluginImpl(fastify, options) {
    invariant(fastify.knex, 'The knex plugin must be configured first')

    fastify.decorate('requireAuth', () => {
      return async (request: FastifyRequest) => {
        // This request is anonymous, no auth required
        if (request.context.config.auth?.anonymous) return

        const token = extractBearerToken(request.headers.authorization ?? '')
        userInvariant(
          token,
          'Authorization header with a bearer token is required',
          401
        )

        if (options.isTest) {
          // Expecting token to be similar to `test-api-key:username:externalId`
          const [, username, externalId] = token.split(':')
          const now = Math.floor(Date.now() / 1000)

          request.token = {
            // Mock token
            uid: externalId,
            aud: 'test_audience',
            auth_time: now,
            exp: now + 15 * 60,
            firebase: {
              identities: {},
              sign_in_provider: 'password',
            },
            iat: now,
            iss: 'test_issuer',
            sub: externalId,
          }

          if (request.context.config.auth?.tokenOnly) return

          request.user = await UserAccountModel.query()
            .findOne({
              username,
            })
            .withGraphFetched('algorandAccount')

          // This return is important! Only use Firebase in non-test mode
          return
        }

        const auth = options.firebase.auth()
        try {
          const verifiedToken = await auth.verifyIdToken(token)
          request.token = verifiedToken

          if (!request.context.config.auth?.tokenOnly) {
            request.user = await UserAccountModel.query()
              .findOne({
                externalId: verifiedToken.uid,
              })
              .withGraphFetched('algorandAccount')

            userInvariant(request.user, 'User not found', 401)
          }
        } catch (error) {
          fastify.log.error(error)
          userInvariant(false, 'Invalid token', 401)
        }
      }
    })
  }
)
