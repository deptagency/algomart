import { WebhookModelSchema, WebhookStatus } from '@algomart/schemas'
import { Model } from 'objection'

/**
 * Store configuration data for webhooks.
 *
 * Intentionally not importing BaseModel, as it is not needed here.
 */
export class WebhookModel extends Model {
  static tableName = 'Webhook'
  static jsonSchema = WebhookModelSchema

  /**
   * _Manual_ ID for primary key, this can be "circle" or "onfido" etc
   */
  id!: string

  /**
   * Third-party ID for the webhook so we can reference it if needed
   */
  externalId!: string | null

  /**
   * The configured URL for the webhook
   */
  endpoint!: string

  /**
   * Status of the webhook, e.g. "active", "pending"
   */
  status!: WebhookStatus

  /**
   * Contains the payload received from the third-party API when the webhook is created.
   * Mostly to hold SNS configuration data for debugging.
   */
  configurationPayload!: unknown
}
