import { FastifyBearerAuthOptions } from 'fastify-bearer-auth'

import { Configuration } from '.'

const bearerAuthOptions: FastifyBearerAuthOptions = {
  keys: new Set(Configuration.apiKey),
}

export default bearerAuthOptions
