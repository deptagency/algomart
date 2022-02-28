import { generateHealthRoute } from './health.routes'
export * from './health.routes'
import { FastifyInstance } from 'fastify'

export function generateHealthRoutes(verifyFn?: () => Promise<string>) {
  return async (app: FastifyInstance) => {
    app.get('/', {}, generateHealthRoute(verifyFn))
  }
}
