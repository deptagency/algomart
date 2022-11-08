import { Language } from '@algomart/schemas'
import { FaqsService } from '@algomart/shared/services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function getFaqs(
  request: FastifyRequest<{ Querystring: Language }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<FaqsService>(FaqsService.name)
  const faqs = await service.getFaqs(request.query.language)
  return reply.send(faqs)
}
