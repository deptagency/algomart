import {
  InitiateUsdcPayoutRequest,
  InitiateWirePayoutRequest,
  UserAccountTransfer,
} from '@algomart/schemas'

import { invariant } from '@/utils/invariant'
import { apiFetcher } from '@/utils/react-query'
import { urls } from '@/utils/urls'

export interface PayoutAPI {
  initiateUsdcPayout(
    payload: InitiateUsdcPayoutRequest
  ): Promise<UserAccountTransfer>
  initiateWirePayout(
    payload: InitiateWirePayoutRequest
  ): Promise<UserAccountTransfer>
}

export class PayoutService implements PayoutAPI {
  private static _instance: PayoutService

  static get instance() {
    return this._instance || (this._instance = new PayoutService())
  }

  constructor() {
    invariant(
      typeof window !== 'undefined',
      'PayoutService must be used in the browser'
    )
  }

  async initiateUsdcPayout(
    json: Omit<InitiateUsdcPayoutRequest, 'userExternalId'>
  ): Promise<UserAccountTransfer> {
    try {
      const response = await apiFetcher().post<UserAccountTransfer>(
        urls.api.payouts.usdcPayout,
        { json }
      )
      return response.id ? response : null
    } catch {
      return null
    }
  }

  async initiateWirePayout(
    json: Omit<InitiateWirePayoutRequest, 'userExternalId'>
  ): Promise<UserAccountTransfer> {
    try {
      const response = await apiFetcher().post<UserAccountTransfer>(
        urls.api.payouts.wirePayout,
        { json }
      )
      return response.id ? response : null
    } catch {
      return null
    }
  }
}
