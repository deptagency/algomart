import { IncomingMessage } from 'node:http'

export default function getBearerToken(request: IncomingMessage) {
  const value = request.headers.authorization

  if (!value) {
    return ''
  }

  const match = value.match(/bearer\s+(\S+)/i)
  if (match) {
    return match[1]
  }

  return ''
}
