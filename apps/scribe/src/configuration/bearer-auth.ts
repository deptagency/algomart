import { FastifyBearerAuthOptions } from '@fastify/bearer-auth'

import { Configuration } from './app-config'

const bearerAuthOptions: FastifyBearerAuthOptions = {
  keys: new Set(Configuration.apiKey),
}

export default bearerAuthOptions
