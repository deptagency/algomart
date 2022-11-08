import { PackWithId, UserAccountTransfer } from '@algomart/schemas'

import { UploadedFileProps } from '@/types/file'
import { invariant } from '@/utils/invariant'
import { apiFetcher } from '@/utils/react-query'
import { urlFor, urls } from '@/utils/urls'

export interface CreateAssetRequest {
  files?: UploadedFileProps[]
}

export interface CollectibleAPI {
  addCollectibleShowcase(id: string): Promise<boolean>
  claim(packTemplateId: string): Promise<{ packId?: string }>
  redeem(code: string): Promise<{ packId?: string }>
  removeCollectibleShowcase(id: string): Promise<boolean>
  shareProfile(shareProfile: boolean): Promise<boolean>
}

export class CollectibleService implements CollectibleAPI {
  private static _instance: CollectibleService

  static get instance() {
    return this._instance || (this._instance = new CollectibleService())
  }

  constructor() {
    invariant(
      typeof window !== 'undefined',
      'CollectibleService must be used in the browser'
    )
  }

  async claim(packTemplateId: string): Promise<{ packId?: string }> {
    const { pack } = await apiFetcher().post<{ pack: PackWithId }>(
      urls.api.packs.claimFree,
      {
        json: { templateId: packTemplateId },
      }
    )

    return { packId: pack.id }
  }

  async redeem(redeemCode: string): Promise<{ packId?: string }> {
    const { pack } = await apiFetcher().post<{ pack: PackWithId }>(
      urls.api.packs.claimRedeem,
      { json: { redeemCode } }
    )

    return { packId: pack?.id }
  }

  async addCollectibleShowcase(collectibleId: string): Promise<boolean> {
    return await apiFetcher()
      .post<boolean>(urls.api.collectibles.showcase, {
        json: {
          collectibleId,
        },
      })
      .then(() => true)
  }

  async removeCollectibleShowcase(collectibleId: string): Promise<boolean> {
    return await apiFetcher()
      .delete<boolean>(urls.api.collectibles.showcase, {
        json: {
          collectibleId,
        },
      })
      .then(() => true)
  }

  async shareProfile(showProfile: boolean): Promise<boolean> {
    return await apiFetcher()
      .patch<boolean>(urls.api.accounts.base, {
        json: {
          showProfile,
        },
      })
      .then(() => true)
  }

  async listForSale(collectibleId: string, price: number) {
    return await apiFetcher()
      .post(urls.api.marketplace.listings, {
        json: { collectibleId, price },
      })
      .then(() => true)
      .catch(() => false)
  }

  async delist(listingId: string) {
    return await apiFetcher()
      .delete(urlFor(urls.api.marketplace.listingsDelist, { listingId }))
      .then(() => true)
      .catch(() => false)
  }
}
