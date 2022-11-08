import {
  ApplicantCreateSchema,
  ApplicantTokenSchema,
  CreateUserAccountRequestSchema,
  PublicUserAccountSchema,
  SendPasswordResetSchema,
  ToApplicantBaseExtendedSchema,
  UpdateUserAccountSchema,
  UserAvatarObjectSchema,
  UserEmailObjectSchema,
  UsernameObjectSchema,
  UserStatusReportSchema,
  WorkflowDetailsSchema,
} from '@algomart/schemas'
import { Type } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'

import {
  createAccount,
  createApplicant,
  deleteTestAccount,
  generateNewWorkflow,
  getApplicant,
  getApplicantToken,
  getAvatarByUsername,
  getByEmail,
  getByUsername,
  getProfile,
  getUserStatusReport,
  requestManualReview,
  sendNewEmailVerification,
  sendPasswordReset,
  updateAccount,
} from './accounts.routes'

export async function accountsRoutes(app: FastifyInstance) {
  // Helps with organization in the Swagger docs
  const tags = ['accounts']
  const security = [
    {
      'Firebase Token': [],
    },
  ]

  // Hooks
  app.addHook('preHandler', app.requireAuth())

  // Services/Routes

  app.post(
    '/',
    {
      config: {
        auth: {
          tokenOnly: true,
        },
      },
      schema: {
        tags,
        security: [
          {
            'Firebase Token': [],
          },
        ],
        body: CreateUserAccountRequestSchema,
        response: {
          201: PublicUserAccountSchema,
        },
      },
    },
    createAccount
  )

  app.get(
    '/',
    {
      schema: {
        tags,
        security: [
          {
            'Firebase Token': [],
          },
        ],
        response: {
          200: PublicUserAccountSchema,
        },
      },
    },
    getProfile
  )

  app.get(
    '/:username',
    {
      config: {
        auth: { anonymous: true },
      },
      schema: {
        tags,
        params: UsernameObjectSchema,
        response: {
          200: PublicUserAccountSchema,
        },
      },
    },
    getByUsername
  )

  app.get(
    '/avatar/:username',
    {
      config: {
        auth: { anonymous: true },
      },
      schema: {
        tags,
        params: UsernameObjectSchema,
        response: {
          200: UserAvatarObjectSchema,
        },
      },
    },
    getAvatarByUsername
  )

  app.get(
    '/email/:email',
    {
      config: {
        auth: { anonymous: true },
      },
      schema: {
        tags,
        params: UserEmailObjectSchema,
        response: {
          200: PublicUserAccountSchema,
        },
      },
    },
    getByEmail
  )

  app.post(
    '/send-password-reset',
    {
      config: {
        auth: { anonymous: true },
      },
      schema: {
        tags,
        body: SendPasswordResetSchema,
        response: {
          204: Type.String(),
        },
      },
    },
    sendPasswordReset
  )

  // Only add the delete endpoint if we're in a test environment
  if (['test', 'development'].includes(process.env.NODE_ENV)) {
    app.delete(
      '/delete-test-account',
      {
        config: {
          auth: { anonymous: true },
        },
        schema: {
          tags,
          response: {
            204: Type.Null(),
          },
        },
      },
      deleteTestAccount
    )
  }

  app.patch(
    '/',
    {
      schema: {
        tags,
        security,
        body: UpdateUserAccountSchema,
        response: {
          204: Type.Null(),
        },
      },
    },
    updateAccount
  )
  app.post(
    '/send-new-email-verification',
    {
      schema: {
        tags,
        security,
        response: {
          204: Type.String(),
        },
      },
    },
    sendNewEmailVerification
  )
  app.post(
    '/applicant',
    {
      schema: {
        tags,
        security,
        body: ApplicantCreateSchema,
        response: {
          201: ToApplicantBaseExtendedSchema,
        },
      },
    },
    createApplicant
  )
  app.get(
    '/applicant/token',
    {
      schema: {
        tags,
        security,
        response: {
          200: ApplicantTokenSchema,
        },
      },
    },
    getApplicantToken
  )
  app.post(
    '/applicant/manual-review',
    {
      schema: {
        tags,
        security,
        response: {
          204: Type.Null(),
        },
      },
    },
    requestManualReview
  )
  app.get(
    '/applicant',
    {
      schema: {
        tags,
        security,
        response: {
          200: ToApplicantBaseExtendedSchema,
        },
      },
    },
    getApplicant
  )
  app.get(
    '/status',
    {
      schema: {
        tags,
        security,
        response: {
          200: UserStatusReportSchema,
        },
      },
    },
    getUserStatusReport
  )
  app.post(
    '/applicant/workflow',
    {
      schema: {
        tags,
        security,
        response: {
          200: WorkflowDetailsSchema,
        },
      },
    },
    generateNewWorkflow
  )
}
