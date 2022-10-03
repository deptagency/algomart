import { DependencyResolver } from '@algomart/shared/utils'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'

declare module 'fastify' {
  interface FastifyInstance {
    container: DependencyResolver
  }

  interface FastifyRequest {
    getContainer: () => DependencyResolver
  }
}

export interface FastifyContainerOptions extends FastifyPluginOptions {
  container: DependencyResolver
}

export const fastifyContainerPlugin = fp(async function fastifyContainer(
  fastify: FastifyInstance,
  options: FastifyContainerOptions
) {
  // Attach container to fastify instance and request
  fastify
    .decorate('container', options.container)
    .decorateRequest('getContainer', () => options.container)
})
