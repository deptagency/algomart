import { DEFAULT_CURRENCY } from '@algomart/schemas'
import {
  Analytics as TAnalytics,
  getAnalytics,
  logEvent,
  setCurrentScreen,
} from 'firebase/analytics'

import loadFirebase from './firebase-client'

import { AuthState } from '@/types/auth'
import { formatIntToFloat } from '@/utils/format-currency'

interface AnalyticsPack {
  itemName: string
  paymentId?: string
  value: number
}

export class Analytics {
  private static _instance: Analytics | undefined
  private analytics: TAnalytics

  static get instance() {
    if (!this._instance) {
      loadFirebase()
      this._instance = new Analytics()
    }
    return this._instance
  }

  constructor() {
    this.analytics = getAnalytics()
  }

  private buildPackPayload({ itemName, paymentId, value }: AnalyticsPack) {
    return {
      currency: DEFAULT_CURRENCY,
      items: [{ item_name: itemName }],
      value: formatIntToFloat(value),
      ...(paymentId && { transaction_id: paymentId }),
    }
  }

  private dispatchEvent(
    event: string,
    payload?: { [key: string]: string | number | { item_name: string }[] }
  ) {
    logEvent(this.analytics, event, payload)
  }

  //#region Supported GA4 events

  /**
   * These events capture key user conversion data within the app.
   * The specific events themselves are recommended by Google tags.
   *
   * Reference: https://developers.google.com/analytics/devguides/collection/ga4/reference/events
   */

  // Triggered when a user fills out payment form on checkout
  addPaymentInfo(packPayload: AnalyticsPack) {
    const payload = this.buildPackPayload(packPayload)
    this.dispatchEvent('add_payment_info', payload)
  }

  // Triggered when a user initiates a checkout flow
  beginCheckout(packPayload: AnalyticsPack) {
    const payload = this.buildPackPayload(packPayload)
    this.dispatchEvent('begin_checkout', payload)
  }

  // Triggered when a user is successfully authenticated
  login(method: AuthState['method']) {
    this.dispatchEvent('login', {
      method: method as string,
    })
  }

  // Triggered when a user completes a checkout flow
  purchase(packPayload: AnalyticsPack) {
    const payload = this.buildPackPayload(packPayload)
    this.dispatchEvent('purchase', payload)
  }

  // Triggered on initial app load as well as each route change
  screenView(url: string) {
    setCurrentScreen(this.analytics, url)
    this.dispatchEvent('screen_view')
  }

  // Triggered when a user views a pack release
  viewItem(packPayload: AnalyticsPack) {
    const payload = this.buildPackPayload(packPayload)
    this.dispatchEvent('view_item', payload)
  }
  //#endregion
}
