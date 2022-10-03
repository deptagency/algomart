import { Configuration } from '@api/configuration'
import { FastifyInstance } from 'fastify'
import { Redis } from 'ioredis'

async function getDatabaseStatus(app: FastifyInstance) {
  const knex = app.knex
  // Bare minimum check to ensure we can query our database
  const stats = await knex.raw(`SELECT 1`).catch(() => ({ rows: [] }))
  return stats.rows.length === 1
}

function makeRedisCheck(redisName: string) {
  return async (app: FastifyInstance) => {
    const redis = app.container.get<Redis>(redisName)

    return await redis
      .connect()
      .then(() => {
        // If we lazily connected we should explicitly disconnect this after we're done.
        redis.disconnect()
        return true
      })
      .catch((error: Error) => {
        if (error.message.includes('Redis is already connecting/connected')) {
          // Already connected, so we're good
          return true
        }

        return false
      })
  }
}

const checks: [string, (app: FastifyInstance) => Promise<unknown>][] = [
  ['postgres', getDatabaseStatus],
  ['jobs_redis', makeRedisCheck('JOBS_REDIS')],
]

if (Configuration.cacheRedis.enabled) {
  checks.push(['cache_redis', makeRedisCheck('CACHE_REDIS')])
}

if (Configuration.rateLimitRedis.enabled) {
  checks.push(['rate_limit_redis', makeRedisCheck('RATE_LIMIT_REDIS')])
}

export async function healthRoutes(app: FastifyInstance) {
  app.get('/', async (_, reply) => {
    const services = await Promise.all(
      checks.map(async ([name, check]) => ({
        name,
        healthy: await check(app),
      }))
    )

    const isOK = services.every((service) => service.healthy)

    reply.status(isOK ? 200 : 503)

    return {
      healthy: isOK,
      services,
    }
  })

  app.get('/postgres', async (_, reply) => {
    const healthy = await getDatabaseStatus(app)
    reply.status(healthy ? 200 : 503)
    return {
      healthy,
    }
  })

  app.get('/rate_limit_redis', async (_, reply) => {
    const healthy = await makeRedisCheck('RATE_LIMIT_REDIS')(app)
    reply.status(healthy ? 200 : 503)
    return {
      healthy,
    }
  })

  app.get('/cache_redis', async (_, reply) => {
    const healthy = await makeRedisCheck('CACHE_REDIS')(app)
    reply.status(healthy ? 200 : 503)
    return {
      healthy,
    }
  })

  app.get('/jobs_redis', async (_, reply) => {
    const healthy = await makeRedisCheck('JOBS_REDIS')(app)
    reply.status(healthy ? 200 : 503)
    return {
      healthy,
    }
  })
}
