import { DEFAULT_CURRENCY } from '@algomart/schemas'
import { CircleAdapter, MailerAdapter } from '@algomart/shared/adapters'
import { invariant } from '@algomart/shared/utils'
import pino from 'pino'

interface MerchantWalletBalanceConfig {
  notificationEmail: string
  usdThreshold: string
}

export class CheckMerchantBalanceService {
  logger: pino.Logger<unknown>

  constructor(
    private readonly config: MerchantWalletBalanceConfig,
    private readonly circle: CircleAdapter,
    private readonly mailer: MailerAdapter,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  async checkMerchantAccountBalance() {
    const usdWallet = await this.fetchMerchantUSDWallet()
    invariant(usdWallet.amount, `Unable retrieve merchant USD Wallet`)

    if (
      Number.parseFloat(usdWallet.amount) <=
      Number.parseFloat(this.config.usdThreshold)
    ) {
      try {
        await this.sendBalanceNotificationEmail(usdWallet.amount)
        const status = `Distpatched low merchant wallet balance notification. Current balance: $${usdWallet.amount}`
        this.logger.info(status)
        return {
          amount: usdWallet.amount,
          status,
        }
      } catch (error) {
        this.logger.error(
          error,
          'Failed to send low merchant wallet balance notification'
        )
        throw error
      }
    }
    return {
      amount: usdWallet.amount,
      status: 'Merchant wallet contains sufficient balances',
    }
  }

  private async fetchMerchantUSDWallet() {
    const { balances } = await this.circle.getMerchantWallet()
    return balances.find((b) => b.currency === DEFAULT_CURRENCY)
  }

  private async sendBalanceNotificationEmail(balance: string) {
    const to = this.config.notificationEmail
    const subject = 'WARNING: Low Circle Account Balance'
    const html = `
      <p>
      The Circle merchant wallet account balance is currently at <strong>$${balance}</strong>, which is below the set threshold of <strong>$${this.config.usdThreshold}</strong>. 
      </p>
      <p>
        Please <a href="https://login.circle.com/" target="_blank">log into the Circle merchant account</a> to add more funds.
      </p>
    `
    await this.mailer.sendEmail({ to, subject, html })
  }
}
