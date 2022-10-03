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
      title: 'AlgoMart API',
      description: 'AlgoMart API endpoints',
      version: '1.0.0-alpha.0',
    },
    tags: [
      { name: 'accounts', description: 'Account endpoints' },
      { name: 'auctions', description: 'Auction endpoints' },
      { name: 'bids', description: 'Bid and auction endpoints' },
      { name: 'collectibles', description: 'Collectible endpoints' },
      { name: 'collections', description: 'Collection endpoints' },
      { name: 'faqs', description: 'Faqs endpoints' },
      { name: 'homepage', description: 'Homepage endpoints' },
      { name: 'i18n', description: 'I18n endpoints' },
      { name: 'packs', description: 'Pack endpoints' },
      { name: 'page', description: 'Page endpoint' },
      { name: 'payments', description: 'Payment endpoints' },
      { name: 'sets', description: 'Set endpoints' },
    ],
    components: {
      securitySchemes: {
        'API Key': {
          description: 'Use a static API key as the bearer token',
          type: 'http',
          scheme: 'bearer',
        },
        'Firebase Token': {
          description: 'Use a Firebase JWT as the bearer token',
          type: 'http',
          scheme: 'bearer',
        },
      },
    },
  },
}

export default swaggerOptions
