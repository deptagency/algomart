import { FastifyRequest } from 'fastify'

export function getIPAddress(request: FastifyRequest) {
  let ipAddress: string | undefined

  if (typeof request.headers['x-forwarded-for'] === 'string') {
    ipAddress = request.headers['x-forwarded-for']
  } else if (request.socket.remoteAddress) {
    ipAddress = request.socket.remoteAddress
  }

  if (ipAddress && ipAddress.includes(',')) {
    return ipAddress.split(',')[0]
  }

  return ipAddress
}
