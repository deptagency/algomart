import { DEFAULT_LANG, DirectusStatus, IPFSStatus } from '@algomart/schemas'
import { NFTStorageAdapter } from '@algomart/shared/adapters'
import {
  CMSCacheCollectibleTemplateModel,
  CMSCachePackTemplateModel,
  CollectibleModel,
  PackModel,
} from '@algomart/shared/models'
import {
  GeneratePacksQueue,
  UploadCollectibleFilesQueue,
} from '@algomart/shared/queues'
import { chunkArray, invariant } from '@algomart/shared/utils'
import { UnrecoverableError } from 'bullmq'
import { AnyQueryBuilder } from 'objection'

import { generatePack } from './pack-generator/pack-generator'
import { toCollectibleBase, toPackBase } from './cms-cache.service'

export interface GeneratorServiceOptions {
  cmsUrl: string
  gcpCdnUrl: string
}
export class GeneratorService {
  constructor(
    private readonly options: GeneratorServiceOptions,
    private readonly storage: NFTStorageAdapter,
    private readonly generatePacksQueue: GeneratePacksQueue,
    private readonly uploadCollectibleFilesQueue: UploadCollectibleFilesQueue
  ) {}

  async queueUploadCollectibleFilesIfNeeded(templateId: string) {
    const { count } = await CollectibleModel.query()
      .where('templateId', templateId)
      .whereNull('assetUrl')
      .whereNull('assetMetadataHash')
      .count()
      .first()
      .castTo<{ count: string }>()

    if (count !== '0') {
      await this.uploadCollectibleFilesQueue.enqueue({ templateId })
    }
  }

  async uploadCollectibleFilesIfNeeded(templateId: string) {
    // Set collectibles to be stored to a pending state
    const affectedRows = await CollectibleModel.query()
      .where('templateId', templateId)
      .whereNull('assetUrl')
      .whereNull('assetMetadataHash')
      .patch({ ipfsStatus: IPFSStatus.Pending })

    // No-op if no collectibles to store
    if (affectedRows === 0) return

    try {
      const cacheTemplate =
        await CMSCacheCollectibleTemplateModel.query().findById(templateId)
      invariant(
        cacheTemplate,
        `Collectible template ${templateId} not found in cache`
      )
      const template = toCollectibleBase(cacheTemplate.content, this.options)

      const imageData = {
        integrityHash: 'sha-FjtZjxN4xrKWGJcFsX3kSMosnFnmBWMYzVckkCfrSkg=',
        mimeType: 'image/jpeg',
        uri: 'ipfs://QmVcabzaL2zNeLri4q5S32u8A8iNQwUMzEamHmAh3nw4qz',
      }
      const animationData = {
        integrityHash: 'sha-+4tXg2G1gW16khsx7m55Ze5PVnZgMAZg2VoyILDRgR0=',
        mimeType: 'video/mp4',
        uri: 'ipfs://QmSr6APDGCpeoRyQJhsdnRNKzUDKVq86W9GhoULmUUFp5X',
      }

      const metadata = this.storage.mapToMetadata({
        ...(animationData && {
          animation_integrity: animationData.integrityHash,
          animation_url_mimetype: animationData.mimeType,
          animation_url: animationData.uri,
        }),
        description: template.subtitle,
        image_integrity: imageData.integrityHash,
        image_mimetype: imageData.mimeType,
        image: imageData.uri,
        name: cacheTemplate.uniqueCode,
        totalEditions: template.totalEditions,
      })

      // Store metadata as JSON on IPFS
      const assetUrl = await this.storage.storeJSON(metadata)

      // Construct JSON hash of metadata
      const assetMetadataHash = this.storage.hashMetadata(metadata)

      const trx = await CollectibleModel.startTransaction()

      try {
        // Update records with new IPFS data
        await CollectibleModel.query(trx)
          .where('templateId', template.templateId)
          .patch({
            assetUrl,
            assetMetadataHash,
            ipfsStatus: IPFSStatus.Stored,
          })

        // Get updated collectibles
        await CollectibleModel.query().where('templateId', template.templateId)

        await trx.commit()
      } catch (error) {
        await trx.rollback()
        throw error
      }
    } catch (error) {
      await CollectibleModel.query()
        .where('templateId', templateId)
        .patch({ ipfsStatus: null, assetUrl: null, assetMetadataHash: null })
      throw error
    }
  }

  async queueCreatePacksIfNeededByCollectibleTemplate(templateId: string) {
    const collectibleTemplate =
      await CMSCacheCollectibleTemplateModel.query().findById(templateId)

    // Skip if the collectible template has no pack template assigned
    if (!collectibleTemplate?.content?.pack_template?.id) return

    await this.queueCreatePacksIfNeeded(
      collectibleTemplate.content.pack_template.id
    )
  }

  async queueCreatePacksIfNeeded(templateId: string) {
    const { count } = await PackModel.query()
      .where('templateId', templateId)
      .count()
      .first()
      .castTo<{ count: string }>()

    // If there's already any number of packs, then don't queue the job
    if (count !== '0') {
      return
    }

    // only queue the job if the pack is published and
    // all of the packs collectible templates are published
    const packTemplate = await CMSCachePackTemplateModel.query().findById(
      templateId
    )

    if (packTemplate?.content?.status !== DirectusStatus.Published) return

    const packNftTemplateIds =
      packTemplate?.content?.nft_templates?.map((template) => template.id) || []
    const packNftTemplatesCount = await CMSCacheCollectibleTemplateModel.query()
      .whereIn('id', packNftTemplateIds)
      .resultSize()

    // collectibles are only populated if they're published
    if (packNftTemplateIds.length === packNftTemplatesCount) {
      await this.generatePacksQueue.enqueue({ templateId })
    }
  }

  async createPacksIfNeeded(templateId: string) {
    const template = await CMSCachePackTemplateModel.query().findById(
      templateId
    )

    // Do not retry if this fails
    invariant(
      template,
      `Pack template ${templateId} not found in cache. Is the pack template published?`,
      UnrecoverableError
    )

    const { nft_templates: collectibleTemplates } = template.content
    const collectibleTemplateIds = collectibleTemplates.map((c) => c.id)
    const collectibleTemplateIdsCount = collectibleTemplates.length
    invariant(
      collectibleTemplateIdsCount > 0,
      `No collectibles associated with pack template ${templateId}`,
      UnrecoverableError
    )

    const totalCollectibles = collectibleTemplates.reduce(
      (sum, t) => sum + t.total_editions,
      0
    )

    const unassignedCollectiblesCount = await CollectibleModel.query()
      .whereIn('templateId', collectibleTemplateIds)
      .whereNull('packId')
      .resultSize()

    // Ensure we have expected amount of collectibles in the DB
    invariant(
      unassignedCollectiblesCount === totalCollectibles,
      `For pack template ${templateId}, expected ${totalCollectibles} but got ${unassignedCollectiblesCount} collectibles, are the related collectible template(s) published and fully sync'd?`
    )

    const unassignedUploadedCollectiblesCount = await CollectibleModel.query()
      .whereIn('templateId', collectibleTemplateIds)
      .whereNull('packId')
      .where('ipfsStatus', IPFSStatus.Stored)
      .resultSize()

    invariant(
      unassignedUploadedCollectiblesCount === totalCollectibles,
      `For pack template ${templateId}, expected ${totalCollectibles} but got ${unassignedUploadedCollectiblesCount} collectibles, are the related collectible(s) stored in IPFS?`
    )

    const balancedPacks = generatePack(
      // We don't care about the URLs here, just providing dummy values
      {
        ...toPackBase(template.content, undefined, DEFAULT_LANG, true),
        // generatePack expects a list of collectibleIds even if show_nfts is false
        collectibleTemplateIds: collectibleTemplates.map(
          (nft_template) => nft_template.id
        ),
      },
      collectibleTemplates
    )

    let generatedPacksCount = 0

    const packChunks = chunkArray(balancedPacks, 10_000)

    // Do we need to delete all relations ahead of this to account for a retry after a partial completion
    // or are the upserts sufficient here?

    for (const packChunk of packChunks) {
      const trx = await PackModel.startTransaction()
      // insert the packs
      const returnData = await PackModel.query(trx)
        .insert(
          packChunk.map((p) => ({
            templateId: p.templateId,
            redeemCode: p.redeemCode,
          }))
        )
        .returning('id')
      const packIds = returnData.map((p) => p.id)

      // patch the collectibles the new pack FKs
      for (const [index, packId] of packIds.entries()) {
        await CollectibleModel.query(trx)
          .whereIn(
            ['edition', 'templateId'],
            packChunk[index].collectibles.map((c) => [
              c.edition,
              c.templateId,
            ]) as unknown as AnyQueryBuilder
          )
          .patch({ packId })
      }
      await trx.commit()
      generatedPacksCount += packIds.length
    }

    return generatedPacksCount
  }
}
