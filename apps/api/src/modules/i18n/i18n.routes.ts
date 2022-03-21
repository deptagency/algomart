import { GetCurrencyConversion, Language } from '@algomart/schemas'
import { FastifyReply, FastifyRequest } from 'fastify'

import I18nService from './i18n.service'

export async function getLanguages(
  request: FastifyRequest<{ Querystring: Language }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<I18nService>(I18nService.name)
  const languages = await service.getLanguages()
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
  request: FastifyRequest<{ Querystring: Language }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<I18nService>(I18nService.name)
  const languages = await service.getLanguages()
  const currencyConversions = await service.getCurrencyConversions(
    {},
    request.transaction
  )

  reply.send({
    languages,
    currencyConversions,
  })
}
