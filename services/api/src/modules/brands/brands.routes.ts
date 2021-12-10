import { Locale } from '@algomart/schemas'
import { FastifyReply, FastifyRequest } from 'fastify'

import BrandsService from './brands.service'

export async function getBrands(
  request: FastifyRequest<{ Querystring: Locale }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<BrandsService>(BrandsService.name)
  const brands = await service.getBrands(request.query.locale)
  reply.send(brands)
}
