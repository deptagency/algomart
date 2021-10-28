import { Email } from '@algomart/schemas'
import sgMail from '@sendgrid/mail'

import { logger } from '@/utils/logger'

export interface SendgridResponseError {
  code: number
  response: {
    headers: { [key: string]: string }
    body: {
      errors: {
        field: string
        help: string
        message: string
      }[]
    }
  }
}
export interface SendgridOptions {
  sendgridApiKey: string
  sendgridFromEmail: string
}

export default class SendgridAdapter {
  logger = logger.child({ context: this.constructor.name })
  sendgridFromEmail: string

  constructor(private readonly options: SendgridOptions) {
    sgMail.setApiKey(options.sendgridApiKey)
    this.sendgridFromEmail = options.sendgridFromEmail
  }

  async sendEmail({ to, subject, html }: Email) {
    const message = {
      to,
      from: {
        email: this.sendgridFromEmail,
        name: 'Algorand Marketplace',
      },
      subject,
      html,
    }

    return await sgMail.send(message)
  }
}
