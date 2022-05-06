import { SwaggerOptions } from '@fastify/swagger'

const swaggerOptions: SwaggerOptions = {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'none',
    deepLinking: true,
    tryItOutEnabled: true,
  },
  exposeRoute: true,
  openapi: {
    info: {
      title: 'AlgoMart Scribe',
      description: 'AlgoMart Scribe Service endpoints',
      version: '1.0.0-alpha.0',
    },
    tags: [],
    components: {
      securitySchemes: {
        'API Key': {
          description: 'API key bearer token',
          type: 'http',
          scheme: 'bearer',
        },
      },
    },
  },
}

export default swaggerOptions
