import { Locale, Slug } from '@algomart/schemas'
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

export async function getBrand(
  request: FastifyRequest<{ Params: Slug; Querystring: Locale }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<BrandsService>(BrandsService.name)
  const brand = await service.getBrand(
    request.params.slug,
    request.query.locale
  )
  reply.send(brand)
}
