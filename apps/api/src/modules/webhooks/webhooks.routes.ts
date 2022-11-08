import { OnfidoWebhookEvent } from '@algomart/schemas'
import {
  AccountsService,
  CircleWebhookService,
} from '@algomart/shared/services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function processRequestOnfido(
  request: FastifyRequest<{
    Body: OnfidoWebhookEvent
    Headers: { 'x-sha2-signature': string }
  }>,
  reply: FastifyReply
) {
  const accounts = request
    .getContainer()
    .get<AccountsService>(AccountsService.name)

  // Check for presence of signature in headers
  const headerSig = request.headers['x-sha2-signature']
  const signature = typeof headerSig === 'string' ? headerSig : null
  if (!signature) return reply.send(500)

  // Verify and process webhook
  const body = JSON.stringify(request.body)
  await accounts.processOnfidoWebhook(body, signature)
  return reply.send(200)
}

export async function handleCircleWebhook(
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.info({ body: request.body })
  const webhooks = request
    .getContainer()
    .get<CircleWebhookService>(CircleWebhookService.name)
  await webhooks.processWebhook(request.body as Record<string, unknown>)
  return reply.send('ok')
}
