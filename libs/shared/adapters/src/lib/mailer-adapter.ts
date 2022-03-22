import pino from 'pino'
import { Email } from '@algomart/schemas'
import { invariant } from '@algomart/shared/utils'
import SendGridMail from '@sendgrid/mail'
import NodeMailer from 'nodemailer'

export type MailerAdapterOptions =
  | {
      emailFrom: string
      emailName: string
      emailTransport: 'sendgrid'
      sendGridApiKey: string
    }
  | {
      emailFrom: string
      emailName: string
      emailTransport: 'smtp'
      smtpHost: string
      smtpPort: number
      smtpUser: string
      smtpPassword: string
    }

export class MailerAdapter {
  logger: pino.Logger<unknown>
  transport: NodeMailer.Transporter | undefined

  constructor(
    private readonly options: MailerAdapterOptions,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
    this.configureTransport()
  }

  async sendEmail({ to, subject, html }: Email) {
    switch (this.options.emailTransport) {
      case 'sendgrid':
        return await SendGridMail.send({
          from: {
            email: this.options.emailFrom,
            name: this.options.emailName,
          },
          to,
          subject,
          html,
        })
      case 'smtp':
        invariant(this.transport, 'smtp transport not configured')
        return await this.transport.sendMail({
          from: `"${this.options.emailName}" <${this.options.emailFrom}>`,
          to,
          subject,
          html,
        })
    }
  }

  configureTransport() {
    switch (this.options.emailTransport) {
      case 'sendgrid':
        SendGridMail.setApiKey(this.options.sendGridApiKey)
        break
      case 'smtp':
        this.transport = NodeMailer.createTransport({
          host: this.options.smtpHost,
          port: this.options.smtpPort,
          auth: {
            user: this.options.smtpUser,
            pass: this.options.smtpPassword,
          },
        })
        break
    }
  }
}
