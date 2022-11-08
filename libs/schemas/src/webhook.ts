import { Static, Type } from '@sinclair/typebox'

import { Simplify } from './shared'

// #region Directus

export const DirectusWebhookSchema = Type.Object({
  collection: Type.String(),
  event: Type.String(),
  key: Type.Optional(Type.String()),
  keys: Type.Optional(Type.Array(Type.String())),
})

// #endregion Directus

// #region Onfido

export enum OnfidoEnvironments {
  live = 'live',
  sandbox = 'sandbox',
}

export enum OnfidoEvents {
  CheckStarted = 'check.started',
  CheckReopened = 'check.reopened',
  CheckWithdrawn = 'check.withdrawn',
  CheckCompleted = 'check.completed',
  CheckFormCompleted = 'check.form_completed',
  ReportWithdrawn = 'report.withdrawn',
  ReportResumed = 'report.resumed',
  ReportCancelled = 'report.cancelled',
  ReportAwaitingApproval = 'report.awaiting_approval',
  ReportCompleted = 'report.completed',
  WorkflowRunCompleted = 'workflow_run.completed',
}

enum OnfidoResourceType {
  check = 'check',
  report = 'report',
  workflow_run = 'workflow_run',
}

const OnfidoWebhookRequestSchema = Type.Object({
  enabled: Type.Optional(Type.Boolean()),
  environments: Type.Optional(Type.Array(Type.String())),
  events: Type.Optional(Type.Array(Type.String())),
})

const OnfidoWebhookSchema = Type.Object({
  id: Type.String(),
  url: Type.Optional(Type.String()),
  enabled: Type.Boolean(),
  href: Type.Optional(Type.String()),
  token: Type.Optional(Type.String()),
  environments: Type.Optional(Type.Array(Type.String())),
  events: Type.Optional(Type.Array(Type.String())),
})

export const OnfidoWebhookEventSchema = Type.Object({
  payload: Type.Object({
    resource_type: Type.Enum(OnfidoResourceType),
    action: Type.Enum(OnfidoEvents),
    object: Type.Object({
      id: Type.String(),
      completed_at_iso8601: Type.String(),
      href: Type.String(),
    }),
  }),
})

// #endregion Onfido

// #region Circle

export const CreateCircleWebhookBodySchema = Type.Object({
  // TODO: should be uri format, but not working
  endpoint: Type.String(),
})

// #endregion Circle

// #region Model

export enum WebhookStatus {
  active = 'active',
  pending = 'pending',
}

export const WebhookModelSchema = Type.Object({
  id: Type.String({ pattern: '^[a-z]+$' }),
  // TODO: should be uri format, but not working
  endpoint: Type.String(),
  status: Type.Enum(WebhookStatus),
  externalId: Type.Optional(Type.String()),
  configurationPayload: Type.Optional(Type.Unknown()),
})

// #endregion Model

export type DirectusWebhook = Simplify<Static<typeof DirectusWebhookSchema>>
export type OnfidoWebhook = Simplify<Static<typeof OnfidoWebhookSchema>>
export type OnfidoWebhookEvent = Simplify<
  Static<typeof OnfidoWebhookEventSchema>
>
export type OnfidoWebhookRequest = Simplify<
  Static<typeof OnfidoWebhookRequestSchema>
>
export type CreateCircleWebhook = Simplify<
  Static<typeof CreateCircleWebhookBodySchema>
>
