import { generateCacheKey } from '@algomart/shared/plugins'
import { I18nService } from '@algomart/shared/services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function getI18nInfo(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const service = request.getContainer().get<I18nService>(I18nService.name)
  const languages = await service.getLanguages()
  const currencyConversions = await service.getCurrencyConversions({})
  return reply.cache(generateCacheKey('i18n'), 3600).send({
    languages,
    currencyConversions,
  })
}
