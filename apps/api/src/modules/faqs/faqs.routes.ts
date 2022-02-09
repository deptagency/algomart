import { Locale } from '@algomart/schemas'
import { FastifyReply, FastifyRequest } from 'fastify'

import FaqsService from './faqs.service'

export async function getFaqs(
  request: FastifyRequest<{ Querystring: Locale }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<FaqsService>(FaqsService.name)
  const faqs = await service.getFaqs(request.query.locale)
  reply.send(faqs)
}
