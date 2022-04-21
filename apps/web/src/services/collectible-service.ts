import {
  InitializeTransferCollectible,
  MintPackStatus,
  MintPackStatusResponse,
  PackWithId,
  TransferCollectible,
  TransferPackStatusList,
} from '@algomart/schemas'
import { WalletTransaction } from '@algomart/shared/algorand'
import ky from 'ky'

import { UploadedFileProps } from '@/types/file'
import { invariant } from '@/utils/invariant'
import { setBearerToken } from '@/utils/ky-hooks'
import { urls } from '@/utils/urls'

export interface CreateAssetRequest {
  files?: UploadedFileProps[]
}

export interface CollectibleAPI {
  addCollectibleShowcase(id: string): Promise<boolean>
  claim(packTemplateId: string): Promise<{ packId?: string }>
  redeem(code: string): Promise<{ packId?: string }>
  removeCollectibleShowcase(id: string): Promise<boolean>
  mintStatus(packId: string): Promise<MintPackStatus>
  transfer(packId: string, passphrase: string): Promise<boolean>
  transferStatus(packId: string): Promise<TransferPackStatusList>
  shareProfile(shareProfile: boolean): Promise<boolean>
  initializeExportCollectible(
    request: Omit<InitializeTransferCollectible, 'externalId'>
  ): Promise<WalletTransaction[]>
  exportCollectible(
    request: Omit<TransferCollectible, 'externalId'>
  ): Promise<{ txId: string }>
  initializeImportCollectible(
    request: Omit<InitializeTransferCollectible, 'externalId'>
  ): Promise<WalletTransaction[]>
  importCollectible(
    request: Omit<TransferCollectible, 'externalId'>
  ): Promise<{ txId: string }>
}

export class CollectibleService implements CollectibleAPI {
  http: typeof ky
  private static _instance: CollectibleService

  static get instance() {
    return this._instance || (this._instance = new CollectibleService())
  }

  constructor() {
    invariant(
      typeof window !== 'undefined',
      'CollectibleService must be used in the browser'
    )
    this.http = ky.create({
      timeout: 10_000,
      throwHttpErrors: false,
      hooks: {
        beforeRequest: [setBearerToken],
      },
    })
  }

  async importCollectible(
    request: Omit<TransferCollectible, 'externalId'>
  ): Promise<{ txId: string }> {
    return await this.http
      .post(urls.api.v1.importCollectible, {
        json: request,
      })
      .json()
  }

  async initializeImportCollectible(
    request: Omit<InitializeTransferCollectible, 'externalId'>
  ): Promise<WalletTransaction[]> {
    return await this.http
      .post(urls.api.v1.initializeImportCollectible, { json: request })
      .json()
  }

  async claim(packTemplateId: string): Promise<{ packId?: string }> {
    const { pack } = await this.http
      .post(urls.api.v1.assetClaim, {
        json: { packTemplateId },
      })
      .json<{ pack: PackWithId }>()

    return { packId: pack.id }
  }

  async redeem(redeemCode: string): Promise<{ packId?: string }> {
    const { pack } = await this.http
      .post(urls.api.v1.assetRedeem, {
        json: { redeemCode },
      })
      .json<{ pack: PackWithId }>()

    return { packId: pack.id }
  }

  async mintStatus(packId: string): Promise<MintPackStatus> {
    const response = await this.http
      .get(urls.api.v1.assetMint, {
        searchParams: { packId },
      })
      .json<MintPackStatusResponse>()

    return response.status
  }

  async transfer(packId: string, passphrase: string): Promise<boolean> {
    const response = await this.http.post(urls.api.v1.assetTransfer, {
      json: { packId, passphrase: passphrase },
      // This may take a while, keep a long timeout...
      timeout: 60_000,
    })

    return response.ok
  }

  async transferStatus(packId: string): Promise<TransferPackStatusList> {
    const response = await this.http
      .get(urls.api.v1.assetTransfer, {
        searchParams: { packId },
      })
      .json<TransferPackStatusList>()

    return response
  }

  async addCollectibleShowcase(id: string): Promise<boolean> {
    const response = await this.http.post(urls.api.v1.showcaseCollectible, {
      json: { id },
    })

    return response.ok
  }

  async removeCollectibleShowcase(id: string): Promise<boolean> {
    const response = await this.http.delete(urls.api.v1.showcaseCollectible, {
      json: { id },
    })

    return response.ok
  }

  async shareProfile(shareProfile: boolean): Promise<boolean> {
    const response = await this.http.put(urls.api.v1.addToShowcase, {
      json: { shareProfile },
    })

    return response.ok
  }

  async initializeExportCollectible(
    request: Omit<InitializeTransferCollectible, 'externalId'>
  ) {
    return await this.http
      .post(urls.api.v1.initializeExportCollectible, { json: request })
      .json<WalletTransaction[]>()
  }

  async exportCollectible(
    request: Omit<TransferCollectible, 'externalId'>
  ): Promise<{ txId: string }> {
    return await this.http
      .post(urls.api.v1.exportCollectible, {
        json: request,
        throwHttpErrors: true,
      })
      .json()
  }
}
