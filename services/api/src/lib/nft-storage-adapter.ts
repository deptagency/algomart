import encBase64 from 'crypto-js/enc-base64'
import sha256 from 'crypto-js/sha256'
import got from 'got'
import { Blob, NFTStorage } from 'nft.storage'

import { Configuration } from '@/configuration'
import { logger } from '@/utils/logger'

export interface ARC3Metadata {
  animation_url_integrity?: string | undefined
  animation_url_mimetype?: string | undefined
  animation_url?: string | undefined
  decimals: number
  description?: string | undefined
  external_url_mimetype: string
  external_url: string
  image_integrity: string
  image_mimetype: string | undefined
  image: string
  name: string
}

export interface StoreMediaInput {
  animationUrl?: string
  imageUrl: string
}

export interface StoreMediaOutput {
  animation_url_integrity?: string | undefined
  animation_url_mimetype?: string | undefined
  animation_url?: string | undefined
  image_integrity: string
  image_mimetype: string | undefined
  image: string
}

export interface StoreMetadataInput {
  description?: string
  editionNumber: number
  mediaMetadata: StoreMediaOutput
  name: string
  totalEditions: number
}

export interface NFTStorageOptions {
  nftStorageKey: string
}

export default class NFTStorageAdapter {
  logger = logger.child({ context: this.constructor.name })
  client: NFTStorage

  constructor(private readonly options: NFTStorageOptions) {
    this.client = new NFTStorage({ token: options.nftStorageKey })
  }

  hashBuffer(buffer: Buffer) {
    //Base64-encoded SHA-256 digest
    return encBase64.stringify(sha256(buffer.toString()))
  }

  hashMetadata(metadata: ARC3Metadata) {
    //SHA-256 digest of the JSON Metadata file as a 32-byte string
    return sha256(JSON.stringify(metadata)).toString()
  }

  mapToMetadata({
    editionNumber,
    mediaMetadata,
    description,
    name,
    totalEditions,
  }: StoreMetadataInput) {
    /**
     * Construct full metadata based on ARC3 Spec
     * https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0003.md#json-metadata-file-schema
     *
     * TODO: In the future when we have individual NFT pages:
     * - this external_url property can be dynamic
     * - external_url_integrity can be added?
     */
    return {
      name: `${name} ${editionNumber}/${totalEditions}`,
      decimals: 0,
      external_url: Configuration.webUrl,
      external_url_mimetype: 'text/html',
      ...(description && { description }),
      ...mediaMetadata,
    }
  }

  async storeMedia({ animationUrl, imageUrl }: StoreMediaInput) {
    try {
      // Fetch assets as buffers
      const image = await got(imageUrl, { responseType: 'buffer' })
      const animation = animationUrl
        ? await got(animationUrl, { responseType: 'buffer' })
        : null

      // Store buffers as media on IFPS
      const imageCid = await this.client.storeBlob(new Blob([image.body]))
      const animationCid = animation
        ? await this.client.storeBlob(new Blob([animation.body]))
        : null

      // Return partial ARC3 metadata
      return {
        image_integrity: `sha256-${this.hashBuffer(image.body)}`,
        image_mimetype: image.headers['content-type'],
        image: `ipfs://${imageCid}`,
        ...(animation &&
          animationCid && {
            animation_integrity: `sha256-${this.hashBuffer(animation.body)}`,
            animation_url_mimetype: animation.headers['content-type'],
            animation_url: `ipfs://${animationCid}`,
          }),
      }
    } catch (error) {
      this.logger.error(error as Error)
      throw error
    }
  }

  async storeMetadata(metadata: ARC3Metadata) {
    try {
      const metadataCid: string = await this.client.storeBlob(
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
      )

      /**
       * Note: metadata should be stored on-chain as a URI with an ipfs:// protocol.
       * However, to verify manually, assets can be viewed through a https:// tunnel.
       *
       * Example using ipfs.io:
       * console.log(`https://ipfs.io/ipfs/${metadataCid}`)
       */

      return `ipfs://${metadataCid}`
    } catch (error) {
      this.logger.error(error as Error)
      throw error
    }
  }
}
