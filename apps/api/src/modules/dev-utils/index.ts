import { invariant } from '@algomart/shared/utils'
import { Type } from '@sinclair/typebox'
import axios from 'axios'
import { FastifyInstance, FastifyRequest } from 'fastify'
import admin from 'firebase-admin'

export async function developmentRoutes(app: FastifyInstance) {
  const tags = ['development utils']

  app.post(
    '/getIdToken',
    {
      schema: {
        tags,
        description: 'Get a Firebase ID token by the UserAccount external ID',
        body: Type.Object({
          userFirebaseExternalId: Type.String(),
        }),
        response: {
          200: Type.String(),
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: { userFirebaseExternalId: string } }>,
      reply
    ) => {
      const apiKey = process.env.FIREBASE_PUBLIC_API_KEY
      invariant(apiKey, 'FIREBASE_PUBLIC_API_KEY is not set')

      const customToken = await admin
        .auth()
        .createCustomToken(request.body.userFirebaseExternalId)

      const { idToken } = await axios
        .post(
          `https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyCustomToken?key=${apiKey}`,
          {
            token: customToken,
            returnSecureToken: true,
          }
        )
        .then(({ data }) => data)
        .catch((error) => {
          console.log(error)
          throw error
        })

      return reply.send(idToken)
    }
  )
}
