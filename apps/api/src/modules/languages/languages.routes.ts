import { Locale } from '@algomart/schemas'
import { LanguagesService } from '@algomart/shared/services'
import { FastifyReply, FastifyRequest } from 'fastify'

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
