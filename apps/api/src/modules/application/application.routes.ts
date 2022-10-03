import { Language } from '@algomart/schemas'
import { ApplicationService } from '@algomart/shared/services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function getCountries(
  request: FastifyRequest<{ Querystring: Language }>,
  reply: FastifyReply
) {
  const countries = await request
    .getContainer()
    .get<ApplicationService>(ApplicationService.name)
    .getCountries(request.query.language)

  return reply.status(200).send(countries)
}
