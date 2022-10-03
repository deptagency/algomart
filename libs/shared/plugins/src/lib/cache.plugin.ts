import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { Redis } from 'ioredis'
import { BinaryLike, createHash } from 'node:crypto'

declare module 'fastify' {
  interface FastifyInstance {
    cacheRedis?: Redis
    cachePrefix: string
    cacheDefaultTTL: number
  }

  interface FastifyReply {
    cache(key: string, ttl?: number): FastifyReply
    _cacheTTL?: number
  }
}

export interface FastifyCachePluginOptions {
  redis: Redis
  prefix: string
  defaultTTL: number
}

function cache(this: FastifyReply, key: string, ttl?: number) {
  const finalTTL = ttl ?? this.server.cacheDefaultTTL
  this.header('ETag', key)
  this.header('Expires', new Date(Date.now() + finalTTL * 1000).toUTCString())
  this.header(
    'Cache-Control',
    `public, max-age=${finalTTL}, s-maxage=${finalTTL}`
  )
  this._cacheTTL = finalTTL
  return this
}

async function onSend(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
  payload: unknown
) {
  const etag = reply.getHeader('etag')
  if (!etag) {
    return payload
  }
  await this.cacheRedis?.set(
    `${this.cachePrefix}:${etag}`,
    JSON.stringify(payload),
    'EX',
    reply._cacheTTL ?? this.cacheDefaultTTL
  )
  return payload
}

async function onRequest(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const etag = request.headers['if-none-match']
  if (!etag) {
    return
  }
  const value = await this.cacheRedis?.get(`${this.cachePrefix}:${etag}`)
  if (!value) {
    return
  }
  reply.status(304).send(JSON.parse(value))
  return reply
}

async function fastifyCachePluginFunction(
  fastify: FastifyInstance,
  options: FastifyCachePluginOptions
) {
  fastify.decorate('cacheRedis', options.redis)
  fastify.decorate('cachePrefix', options.prefix)
  fastify.decorate('cacheDefaultTTL', options.defaultTTL)
  fastify.decorateReply('cache', cache)
  fastify.addHook('onSend', onSend)
  fastify.addHook('onRequest', onRequest)
}

function SHA256(value: BinaryLike) {
  return createHash('sha256').update(value).digest('base64')
}

export function generateCacheKey(
  base: string,
  options: (string | number | boolean)[] = []
) {
  const key = [base, ...options].join('-')
  return SHA256(key)
}

/**
 * Custom Fastify plugin to cache responses. Adds the `reply.cache(key, [ttl])`
 * helper to set the cache headers. Optionally cache responses in Redis.
 *
 * @see https://github.com/fastify/fastify-caching
 */
export const fastifyCachePlugin = fp(fastifyCachePluginFunction)
