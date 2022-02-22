import { Locale } from '@algomart/schemas'
import { FaqsService } from '@algomart/shared/services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function getFaqs(
  request: FastifyRequest<{ Querystring: Locale }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<FaqsService>(FaqsService.name)
  const faqs = await service.getFaqs(request.query.locale)
  reply.send(faqs)
}
