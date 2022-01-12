import { SwaggerOptions } from 'fastify-swagger'

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
      title: 'Test swagger',
      description: 'Testing the Fastify swagger API',
      version: '0.1.0',
    },
    tags: [
      { name: 'accounts', description: 'Account endpoints' },
      { name: 'bids', description: 'Bid and auction endpoints' },
      { name: 'collectibles', description: 'Collectible endpoints' },
      { name: 'collections', description: 'Collection endpoints' },
      { name: 'homepage', description: 'Homepage endpoints' },
      { name: 'packs', description: 'Pack endpoints' },
      { name: 'payments', description: 'Payment endpoints' },
      { name: 'sets', description: 'Set endpoints' },
    ],
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
