import {
  CreateCircleWebhook,
  UsersVerificationQuerystring,
} from '@algomart/schemas'
import {
  AccountsService,
  CircleWebhookService,
} from '@algomart/shared/services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function getUsersByVerificationStatus(
  request: FastifyRequest<{ Querystring: UsersVerificationQuerystring }>,
  reply: FastifyReply
) {
  const accounts = request
    .getContainer()
    .get<AccountsService>(AccountsService.name)
  const users = await accounts.getUsersByVerificationStatus(request.query)
  return reply.send(users)
}

export async function createCircleWebhook(
  request: FastifyRequest<{ Body: CreateCircleWebhook }>,
  reply: FastifyReply
) {
  const webhooks = request
    .getContainer()
    .get<CircleWebhookService>(CircleWebhookService.name)
  const result = await webhooks.createSubscription(request.body)
  return result
    ? reply.status(201).send(result)
    : reply.status(400).send({ error: 'Error creating webhook' })
}

export async function getCircleWebhook(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const webhooks = request
    .getContainer()
    .get<CircleWebhookService>(CircleWebhookService.name)
  const result = await webhooks.getSubscription()
  return result
    ? reply.send(result)
    : reply.status(404).send({ error: 'No webhook configured' })
}

export async function deleteCircleWebhook(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const webhooks = request
    .getContainer()
    .get<CircleWebhookService>(CircleWebhookService.name)
  await webhooks.deleteSubscription()
  return reply.status(204).send()
}
