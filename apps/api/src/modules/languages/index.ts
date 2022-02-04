import { LanguageListSchema } from '@algomart/schemas'
import { FastifyInstance } from 'fastify'

import { getLanguages } from './languages.routes'

import { appErrorHandler } from '@/utils/errors'

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
