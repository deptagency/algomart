import { DEFAULT_CURRENCY } from '@algomart/schemas'
import {
  Analytics,
  getAnalytics,
  logEvent,
  setCurrentScreen,
} from 'firebase/analytics'
import { useMemo } from 'react'

import { useFirebaseApp } from './use-firebase-app'

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

function dispatchEvent(
  analytics: Analytics,
  event: string,
  payload?: { [key: string]: string | number | { item_name: string }[] }
) {
  logEvent(analytics, event, payload)
}

export function useAnalytics() {
  const firebaseApp = useFirebaseApp()
  const analytics = useMemo(() => {
    if (firebaseApp?.options.projectId) {
      return getAnalytics()
    }

    return null
  }, [firebaseApp])

  return useMemo(
    () => ({
      addPaymentInfo(packPayload: AnalyticsPack) {
        if (analytics) {
          const payload = buildPackPayload(packPayload)
          dispatchEvent(analytics, 'add_payment_info', payload)
        }
      },

      // Triggered when a user initiates a checkout flow
      beginCheckout(packPayload: AnalyticsPack) {
        if (analytics) {
          const payload = buildPackPayload(packPayload)
          dispatchEvent(analytics, 'begin_checkout', payload)
        }
      },

      // Triggered when a user is successfully authenticated
      login(method: AuthState['method']) {
        if (analytics) {
          dispatchEvent(analytics, 'login', {
            method: method as string,
          })
        }
      },

      // Triggered when a user completes a checkout flow
      purchase(packPayload: AnalyticsPack) {
        if (analytics) {
          const payload = buildPackPayload(packPayload)
          dispatchEvent(analytics, 'purchase', payload)
        }
      },

      // Triggered on initial app load as well as each route change
      screenView(url: string) {
        if (analytics) {
          setCurrentScreen(analytics, url)
          dispatchEvent(analytics, 'screen_view')
        }
      },

      // Triggered when a user views a pack release
      viewItem(packPayload: AnalyticsPack) {
        if (analytics) {
          const payload = buildPackPayload(packPayload)
          dispatchEvent(analytics, 'view_item', payload)
        }
      },
      //#endregion
    }),
    [analytics]
  )
}
