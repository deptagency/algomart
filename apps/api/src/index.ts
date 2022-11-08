import buildApp from '@api/api/build-app'
import { Configuration } from '@api/configuration'
import { configureResolver } from '@api/configuration/configure-resolver'
import buildKnexConfiguration from '@api/configuration/knex-config'
import { logger } from '@api/configuration/logger'

async function start() {
  try {
    const app = await buildApp({
      fastify: { logger },
      knex: buildKnexConfiguration(),
      container: configureResolver(),
      enableTrap: true,
    })

    await app.listen({
      port: Configuration.port,
      host: Configuration.host,
    })

    const addr = `${Configuration.host}:${Configuration.port}`
    logger.info(`API service is listening at ${addr}`)
  } catch (error) {
    logger.error(error)
    throw error
  }
}

start()
