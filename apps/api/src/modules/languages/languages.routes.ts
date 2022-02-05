import { Locale } from '@algomart/schemas'
import { FastifyReply, FastifyRequest } from 'fastify'

import LanguagesService from './languages.service'

export async function getLanguages(
  request: FastifyRequest<{ Querystring: Locale }>,
  reply: FastifyReply
) {
  const service = request
    .getContainer()
    .get<LanguagesService>(LanguagesService.name)
  const languages = await service.getLanguages(request.query.locale)
  reply.send(languages)
}
