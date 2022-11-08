import {
  ApplicantCreate,
  CreateUserAccountRequest,
  DeleteTestAccount,
  SendPasswordReset,
  UpdateUserAccount,
  UserEmail,
  Username,
} from '@algomart/schemas'
import { generateCacheKey } from '@algomart/shared/plugins'
import { AccountsService } from '@algomart/shared/services'
import { getIPAddress } from '@algomart/shared/utils'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function createAccount(
  request: FastifyRequest<{ Body: CreateUserAccountRequest }>,
  reply: FastifyReply
) {
  const accounts = request
    .getContainer()
    .get<AccountsService>(AccountsService.name)
  const account = await accounts.create(
    request.token.uid,
    request.body,
    getIPAddress(request)
  )

  return reply.status(201).send(account)
}

export async function getProfile(request: FastifyRequest, reply: FastifyReply) {
  const accounts = request
    .getContainer()
    .get<AccountsService>(AccountsService.name)
  const token = request.token
  const account = await accounts.getByExternalId({
    userExternalId: token.uid,
  })
  return reply.send(account)
}

export async function getByUsername(
  request: FastifyRequest<{ Params: Username }>,
  reply: FastifyReply
) {
  const accounts = request
    .getContainer()
    .get<AccountsService>(AccountsService.name)
  const account = await accounts.getByUsername(request.params)
  return reply.send(account)
}

export async function getByEmail(
  request: FastifyRequest<{ Params: UserEmail }>,
  reply: FastifyReply
) {
  const accounts = request
    .getContainer()
    .get<AccountsService>(AccountsService.name)
  const account = await accounts.getByEmail(request.params)

  return reply.send(account)
}

export async function getAvatarByUsername(
  request: FastifyRequest<{ Params: Username }>,
  reply: FastifyReply
) {
  const accounts = request
    .getContainer()
    .get<AccountsService>(AccountsService.name)

  const avatar = await accounts.getAvatarByUsername(request.params)
  const cacheKey = generateCacheKey('avatar', [request.params.username])

  return reply.cache(cacheKey).send(avatar)
}

export async function sendPasswordReset(
  request: FastifyRequest<{ Body: SendPasswordReset }>,
  reply: FastifyReply
) {
  const accounts = request
    .getContainer()
    .get<AccountsService>(AccountsService.name)

  await accounts.sendPasswordReset(request.body.email)

  return reply.status(204).send()
}

export async function deleteTestAccount(
  request: FastifyRequest<{ Body: DeleteTestAccount }>,
  reply: FastifyReply
) {
  const accounts = request
    .getContainer()
    .get<AccountsService>(AccountsService.name)

  await accounts.deleteTestAccount(request.body.usernames)
  return reply.status(204).send()
}

export async function updateAccount(
  request: FastifyRequest<{
    Body: UpdateUserAccount
  }>,
  reply: FastifyReply
) {
  const accounts = request
    .getContainer()
    .get<AccountsService>(AccountsService.name)

  await accounts.updateAccount(request.user.id, {
    ...request.body,
  })
  return reply.status(204).send()
}

export async function sendNewEmailVerification(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const accounts = request
    .getContainer()
    .get<AccountsService>(AccountsService.name)

  await accounts.sendNewEmailVerification(request.user)

  return reply.status(204).send()
}

export async function createApplicant(
  request: FastifyRequest<{ Body: ApplicantCreate }>,
  reply: FastifyReply
) {
  const accounts = request
    .getContainer()
    .get<AccountsService>(AccountsService.name)
  const applicant = await accounts.createApplicant(request.user, request.body)
  return reply.status(201).send(applicant)
}

export async function getApplicantToken(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const accounts = request
    .getContainer()
    .get<AccountsService>(AccountsService.name)
  const applicant = await accounts.getApplicantToken(request.user)
  return reply.status(200).send(applicant)
}

export async function requestManualReview(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const accounts = request
    .getContainer()
    .get<AccountsService>(AccountsService.name)
  await accounts.getApplicantToken(request.user)
  return reply.status(204).send()
}

export async function getApplicant(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const accounts = request
    .getContainer()
    .get<AccountsService>(AccountsService.name)
  const applicantDetails = await accounts.getApplicant(request.user)
  return reply.status(200).send(applicantDetails)
}

export async function getUserStatusReport(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const accounts = request
    .getContainer()
    .get<AccountsService>(AccountsService.name)
  const user = await accounts.getUserStatus(request.user)
  return reply.status(200).send(user)
}

export async function generateNewWorkflow(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const accounts = request
    .getContainer()
    .get<AccountsService>(AccountsService.name)
  const workflow = await accounts.generateNewWorkflow(request.user)
  return reply.status(200).send(workflow)
}
