import buildApp from '@api/api/build-app'
import { Configuration } from '@api/configuration'
import buildKnexConfiguration from '@api/configuration/knex-config'
import { logger } from '@api/configuration/logger'
import { configureResolver } from '@api/shared/dependency-resolver'
import { configureTasks } from '@api/tasks'

buildApp({
  fastify: { logger },
  knex: buildKnexConfiguration(),
  container: configureResolver(),
  enableTrap: true,
})
  .then((app) => {
    configureTasks(app)
    return app.listen(Configuration.port, Configuration.host)
  })
  .catch((error) => {
    logger.error(error)
    throw error
  })
