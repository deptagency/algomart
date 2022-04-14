import { DEFAULT_CURRENCY } from '@algomart/schemas'
import { useMemo } from 'react'

import {
  useFirebaseApp,
  waitForFirebaseAppToBeConfigured,
} from './use-firebase-app'

import { AuthState } from '@/types/auth'
import { formatIntToFloat } from '@/utils/format-currency'

export interface AnalyticsPack {
  itemName: string
  paymentId?: string
  value: number
}

function buildPackPayload({ itemName, paymentId, value }: AnalyticsPack) {
  return {
    currency: DEFAULT_CURRENCY,
    items: [{ item_name: itemName }],
    value: formatIntToFloat(value),
    ...(paymentId && { transaction_id: paymentId }),
  }
}

export async function getFirebaseAnalyticsAsync() {
  return import('firebase/analytics')
}

async function dispatchEvent(
  event: string,
  payload?: { [key: string]: string | number | { item_name: string }[] }
) {
  if (await waitForFirebaseAppToBeConfigured()) {
    const { getAnalytics, logEvent } = await getFirebaseAnalyticsAsync()
    const analytics = getAnalytics()
    logEvent(analytics, event, payload)
  }
}

async function setCurrentScreenAsync(screenName: string) {
  if (await waitForFirebaseAppToBeConfigured()) {
    const { getAnalytics, setCurrentScreen } = await getFirebaseAnalyticsAsync()
    const analytics = getAnalytics()
    setCurrentScreen(analytics, screenName)
  }
}

export function useAnalytics() {
  // Ensure firebase is loaded and configured, no need to process the result
  useFirebaseApp()
  return useMemo(
    () => ({
      addPaymentInfo(packPayload: AnalyticsPack) {
        const payload = buildPackPayload(packPayload)
        dispatchEvent('add_payment_info', payload)
      },

      // Triggered when a user initiates a checkout flow
      beginCheckout(packPayload: AnalyticsPack) {
        const payload = buildPackPayload(packPayload)
        dispatchEvent('begin_checkout', payload)
      },

      // Triggered when a user is successfully authenticated
      login(method: AuthState['method']) {
        dispatchEvent('login', {
          method: method as string,
        })
      },

      // Triggered when a user completes a checkout flow
      purchase(packPayload: AnalyticsPack) {
        const payload = buildPackPayload(packPayload)
        dispatchEvent('purchase', payload)
      },

      // Triggered on initial app load as well as each route change
      screenView(url: string) {
        setCurrentScreenAsync(url)
        dispatchEvent('screen_view')
      },

      // Triggered when a user views a pack release
      viewItem(packPayload: AnalyticsPack) {
        const payload = buildPackPayload(packPayload)
        dispatchEvent('view_item', payload)
      },
      //#endregion
    }),
    []
  )
}
