import { GetCurrencyConversion, Locale } from '@algomart/schemas'
import { I18nService } from '@algomart/shared/services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function getLanguages(
  request: FastifyRequest<{ Querystring: Locale }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<I18nService>(I18nService.name)
  const languages = await service.getLanguages(request.query.locale)
  reply.send(languages)
}

export async function getCurrencyConversion(
  request: FastifyRequest<{ Querystring: GetCurrencyConversion }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<I18nService>(I18nService.name)
  const { sourceCurrency, targetCurrency } = request.query
  const currencyConversion = await service.getCurrencyConversion(
    { sourceCurrency, targetCurrency },
    request.transaction
  )
  reply.send(currencyConversion)
}

export async function getCurrencyConversions(
  request: FastifyRequest<{ Querystring: GetCurrencyConversion }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<I18nService>(I18nService.name)
  const { sourceCurrency } = request.query

  const currencyConversions = await service.getCurrencyConversion(
    { sourceCurrency },
    request.transaction
  )
  reply.send(currencyConversions)
}

export async function getI18nInfo(
  request: FastifyRequest<{ Querystring: Locale }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<I18nService>(I18nService.name)
  const languages = await service.getLanguages(request.query.locale)
  const currencyConversions = await service.getCurrencyConversions(
    {},
    request.transaction
  )

  reply.send({
    languages,
    currencyConversions,
  })
}
