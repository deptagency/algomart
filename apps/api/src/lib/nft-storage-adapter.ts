import { HttpTransport } from '@algomart/shared/utils'
import { invariant } from '@algomart/shared/utils'
import { Configuration } from '@api/configuration'
import { logger } from '@api/configuration/logger'
import pinataSDK, { PinataClient } from '@pinata/sdk'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import stream from 'node:stream'
import { promisify } from 'node:util'
import { getMimeType } from 'stream-mime-type'

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

export interface StoreMetadataInput extends StoreMediaOutput {
  description?: string
  name: string
  totalEditions: number
}

export interface NFTStorageAdapterOptions {
  pinataApiKey: string
  pinataApiSecret: string
}
export default class NFTStorageAdapter {
  client: PinataClient
  logger = logger.child({ context: this.constructor.name })

  constructor(private readonly options: NFTStorageAdapterOptions) {
    this.client = pinataSDK(options.pinataApiKey, options.pinataApiSecret)

    this.testConnection()
  }

  async testConnection() {
    try {
      const { authenticated } = await this.client.testAuthentication()
      invariant(authenticated)
      this.logger.info('Successfully connected to Pinata')
    } catch (error) {
      this.logger.error(error, 'Failed to connect to Pinata')
    }
  }

  hashMetadata(metadata: ARC3Metadata) {
    //SHA-256 digest of the JSON Metadata file as a 32-byte string
    const hash = crypto.createHash('sha256')
    hash.update(JSON.stringify(metadata))
    return hash.digest('hex')
  }

  mapToMetadata({
    description,
    name,
    totalEditions,
    ...rest
  }: StoreMetadataInput): ARC3Metadata {
    /**
     * Construct full metadata based on ARC3 Spec
     * https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0003.md#json-metadata-file-schema
     */
    return {
      name: `${name} (${totalEditions} editions)`,
      decimals: 0,
      external_url: Configuration.webUrl,
      external_url_mimetype: 'text/html',
      ...(description && { description }),
      ...rest,
    }
  }

  async storeFile(url: string) {
    const fileName = path.basename(new URL(url).pathname)
    try {
      // If CMS_PUBLIC_URL is set, we need to replace it with the internal URL
      const internalURL = url.includes(Configuration.cmsPublicUrl)
        ? url.replace(Configuration.cmsPublicUrl, Configuration.cmsUrl)
        : url
      const pipeline = promisify(stream.pipeline)
      const http = new HttpTransport()

      // Kick off download stream, intercept file metadata
      const downloadStream = await http.stream(internalURL)
      const { mime, stream: outStream } = await getMimeType(downloadStream)
      outStream.on('error', (error: Error) => {
        this.logger.error(error, `Failed to download ${fileName}`)
        throw error
      })

      // Pipe downloaded file to fs
      const fileWriteStream = fs
        .createWriteStream(fileName)
        .on('error', (error: Error) => {
          this.logger.error(error, `Failed to save ${fileName}`)
          throw error
        })
      await pipeline(outStream, fileWriteStream)

      // Read file and send to IPFS
      const fileReadStream = fs.createReadStream(fileName)
      const fileUpload = await this.client.pinFileToIPFS(fileReadStream)

      // Read file and hash it
      const hash = crypto.createHash('sha256').setEncoding('base64')
      const hashReadStream = fs.createReadStream(fileName).on('end', () => {
        hash.end()
      })
      await pipeline(hashReadStream, hash)

      // Remove file
      fs.unlinkSync(fileName)

      // Provide file information
      return {
        integrityHash: `sha-${hash.read()}`,
        mimeType: mime,
        uri: `ipfs://${fileUpload.IpfsHash}`,
      }
    } finally {
      if (fs.existsSync(fileName)) {
        fs.unlinkSync(fileName)
      }
    }
  }

  async storeJSON(metadata: ARC3Metadata) {
    const { IpfsHash } = await this.client.pinJSONToIPFS(metadata, {
      pinataMetadata: { name: metadata.name },
    })

    /**
     * Note: metadata should be stored on-chain as a URI with an ipfs:// protocol.
     * However, to verify manually, assets can be viewed through a https:// tunnel.
     *
     * Example using ipfs.io:
     * console.log(`https://ipfs.io/ipfs/${IpfsHash}`)
     */

    return `ipfs://${IpfsHash}`
  }
}
