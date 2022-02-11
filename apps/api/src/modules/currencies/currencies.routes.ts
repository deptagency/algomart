import { GetCurrencyConversion } from '@algomart/schemas'
import { FastifyReply, FastifyRequest } from 'fastify'

import CurrencysService from './currencies.service'

export async function getCurrencyConversion(
  request: FastifyRequest<{ Querystring: GetCurrencyConversion }>,
  reply: FastifyReply
) {
  const service = request
    .getContainer()
    .get<CurrencysService>(CurrencysService.name)
  const { sourceCurrency, targetCurrency } = request.query
  const homepage = await service.getCurrencyConversion(
    { sourceCurrency, targetCurrency },
    request.transaction
  )
  reply.send(homepage)
}

export async function getCurrencyConversions(
  request: FastifyRequest<{ Querystring: GetCurrencyConversion }>,
  reply: FastifyReply
) {
  const service = request
    .getContainer()
    .get<CurrencysService>(CurrencysService.name)
  const { sourceCurrency } = request.query

  const homepage = await service.getCurrencyConversion(
    { sourceCurrency },
    request.transaction
  )
  reply.send(homepage)
}
