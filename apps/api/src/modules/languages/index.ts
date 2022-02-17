import { LanguageListSchema } from '@algomart/schemas'
import { appErrorHandler } from '@algomart/shared/utils'
import { FastifyInstance } from 'fastify'

import { getLanguages } from './languages.routes'

export async function languagesRoutes(app: FastifyInstance) {
  const tags = ['languages']

  // Errors
  app.setErrorHandler(appErrorHandler(app))

  // Services/Routes
  app.get(
    '/',
    {
      schema: {
        tags,
        description: 'Get list of languages',
        response: {
          200: LanguageListSchema,
        },
      },
    },
    getLanguages
  )
}
