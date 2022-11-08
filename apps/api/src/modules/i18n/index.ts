import { I18nInfoSchema } from '@algomart/schemas'
import { FastifyInstance } from 'fastify'

import { getI18nInfo } from './i18n.routes'

export async function i18nRoutes(app: FastifyInstance) {
  const tags = ['i18n']

  // Services/Routes
  app.get(
    '/',
    {
      schema: {
        tags,
        description: 'Get supported languages and currency conversions',
        response: {
          200: I18nInfoSchema,
        },
      },
    },
    getI18nInfo
  )
}
