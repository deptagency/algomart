import { Locale } from '@algomart/schemas'
import { FastifyReply, FastifyRequest } from 'fastify'

import ApplicationService from './application.service'

export async function getCountries(
  request: FastifyRequest<{ Querystring: Locale }>,
  reply: FastifyReply
) {
  const countries = await request
    .getContainer()
    .get<ApplicationService>(ApplicationService.name)
    .getCountries(request.query.locale)

  reply.status(200).send(countries)
}
