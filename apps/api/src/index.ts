import buildApp from '@api/api/build-app'
import { Configuration } from '@api/configuration'
import { configureResolver } from '@api/configuration/configure-resolver'
import buildKnexConfiguration from '@api/configuration/knex-config'
import { logger } from '@api/configuration/logger'

buildApp({
  fastify: { logger },
  knex: buildKnexConfiguration(),
  container: configureResolver(),
  enableTrap: true,
})
  .then((app) => {
    return app.listen(Configuration.port, Configuration.host)
  })
  .catch((error) => {
    logger.error(error)
    throw error
  })
