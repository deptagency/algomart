import {
  MintPackStatus,
  MintPackStatusResponse,
  PackWithId,
  TransferPackStatusList,
} from '@algomart/schemas'
import { getAuth } from 'firebase/auth'
import ky from 'ky'

import loadFirebase from '@/clients/firebase-client'
import { UploadedFileProps } from '@/types/file'
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
  exportCollectible(
    assetIndex: number,
    address: string,
    passphrase: string
  ): Promise<boolean>
}

export class CollectibleService implements CollectibleAPI {
  http: typeof ky

  constructor() {
    this.http = ky.create({
      timeout: 10_000,
      throwHttpErrors: false,
      hooks: {
        beforeRequest: [
          async (request) => {
            try {
              const auth = getAuth(loadFirebase())
              const token = await auth.currentUser?.getIdToken()
              if (token) {
                request.headers.set('Authorization', `Bearer ${token}`)
              }
            } catch {
              // ignore, firebase probably not initialized
            }
          },
        ],
      },
    })
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

  async exportCollectible(
    assetIndex: number,
    address: string,
    passphrase: string
  ): Promise<boolean> {
    const response = await this.http.post(urls.api.v1.exportCollectible, {
      json: { assetIndex, address, passphrase },
    })

    return response.ok
  }
}

const collectibleService: CollectibleAPI = new CollectibleService()

export default collectibleService
