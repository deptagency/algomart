import { FaqsSchema, LanguageObjectSchema } from '@algomart/schemas'
import { FastifyInstance } from 'fastify'

import { getFaqs } from './faqs.routes'

export async function faqsRoutes(app: FastifyInstance) {
  const tags = ['faqs']

  // Services/Routes
  app.get(
    '/',
    {
      schema: {
        tags,
        querystring: LanguageObjectSchema,
        response: {
          200: FaqsSchema,
        },
      },
    },
    getFaqs
  )
}
