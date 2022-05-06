import buildApp from '@api/api/build-app'
import { Configuration } from '@api/configuration'
import { configureResolver } from '@api/configuration/configure-resolver'
import buildKnexConfiguration from '@api/configuration/knex-config'
import { logger } from '@api/configuration/logger'
import cluster from 'node:cluster'
import { cpus } from 'node:os'
import process from 'node:process'

const numberCPUs = cpus().length

async function start(pid: number, type: 'primary' | 'worker') {
  try {
    const app = await buildApp({
      fastify: { logger },
      knex: buildKnexConfiguration(),
      container: configureResolver(),
      enableTrap: true,
    })

    await app.listen(Configuration.port, Configuration.host)

    logger.info(`Started ${type} process ${pid}`)
  } catch (error) {
    logger.error(error)
    throw error
  }
}

if (Configuration.enableCluster) {
  if (cluster.isPrimary) {
    logger.info(
      `Primary ${process.pid} is running, starting ${numberCPUs} workers`
    )

    for (let index = 0; index < numberCPUs; index++) {
      cluster.fork()
    }

    cluster.on('exit', (worker, code, signal) => {
      logger.info(
        `Worker ${worker.process.pid} died with code ${code} and signal ${signal}`
      )
    })
  } else {
    start(process.pid, 'worker')
  }
} else {
  logger.info(`Primary ${process.pid} is running, without workers`)
  start(process.pid, 'primary')
}
