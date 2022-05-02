import { ProductQuery } from '@algomart/schemas'
import { ProductsService } from '@algomart/shared/services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function searchProducts(
  request: FastifyRequest<{
    Querystring: ProductQuery
  }>,
  reply: FastifyReply
) {
  const service = request
    .getContainer()
    .get<ProductsService>(ProductsService.name)
  const result = await service.searchProducts(request.query)
  reply.send(result)
}
