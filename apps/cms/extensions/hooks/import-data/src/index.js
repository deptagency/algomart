import {
	handleCsvBatching,
	importFile,
	sanitizeBoolean,
	sanitizeCurrency,
	sanitizeEnum,
	sanitizeInteger,
	sanitizeString,
	sanitizeTimestamp,
	getEntityIdByUniqueAttr,
	createImportPreset
} from './utils.js'
import {
	Report,
	processReportResults,
	reportError
} from './report.js'
import csvParser from 'csv-parser'

/**
 * NOTE: Due to the nature of CMS entity relationships, the following constraints apply:
 * - Collections must be imported before Sets.
 * - Sets must be imported before NFT Templates.
 * - Pack Templates must be imported before NFT Templates.
 * - Rarities must be imported before NFT templates.
 * - Tags must be impororted before NFT templates.
 *
 * Therefore, the following order of import is recommended:
 * 1. Rarities
 * 2. Collections
 * 3. Sets
 * 4. Tags
 * 5. Pack Templates
 * 6. NFT Templates
 */
export default ({ action }, { services }) => {
	const { ItemsService, AssetsService, FilesService, PresetsService } = services

	const runImport = async (meta, { database, schema, accountability }) => {
		createImportPreset(database, schema, PresetsService)

		//When creating a new object meta.key is defined
		//When updating an object meta.keys is defined
		let key = (meta.key) ? meta.key : meta.keys[0]

		const importService = new ItemsService('import_files', { schema: schema })
		const assetsService = new AssetsService({ schema: schema })
		const fileService = new FilesService({ schema: schema, accountability: { ...accountability, admin: true } })

		//Get the full object, merging db and payload. We merge with payload
		//here since Directus calls action hooks async with no await, so
		//it's possible the save has not finished yet.
		const dataImportDB = await importService.readOne(key)
		const dataImport = { ...dataImportDB, ...meta.payload }

		if (dataImport.run_import && dataImport.status === 'uploaded') {
			const { stream, file } = await assetsService.getAsset(dataImport.import_file, {});
			await importService.updateOne(key, { status: 'importing' })
			let report = new Report(key, schema)

			// Map to entitiy
			switch (dataImport.entity_type) {
				case 'rarities':
					console.log('Importing rarities...')
					await importRarities(schema, accountability, stream, report)
					break
				case 'collections':
					console.log('Importing collections...')
					await importCollections(schema, accountability, stream, report)
					break
				case 'sets':
					console.log('Importing sets...')
					await importSets(schema, accountability, stream, report)
					break
				case 'tags':
					console.log('Importing tags...')
					await importTags(schema, accountability, stream, report)
					break
				case 'pack_templates':
					console.log('Importing pack_templates...')
					await importPackTemplates(schema, accountability, stream, report)
					break
				case 'nft_templates':
					console.log('Importing nft_templates...')
					await importNftTemplates(schema, accountability, stream, report)
					break
				case 'nft_templates_update':
					console.log('Updating nft_templates...')
					await updateNftTemplates(schema, accountability, stream, report)
					break
				default:
					console.warn(`No entities matched ${dataImport.entity_type}.`)
			}

			await processReportResults(report, file, fileService, importService)
		}
	}

	async function importRarities(schema, accountability, stream, report) {
		const importService = new ItemsService('rarities', { schema: schema, accountability: { ...accountability, admin: true } })
		const readStream = stream.pipe(csvParser())

		const processRow = async (row) => {
			try {
				// Create rarity
				await importService.createOne({
					code: sanitizeString(row.CODE),
					color: sanitizeString(row.COLOR),
					translations: [
						{
							languages_code: 'en-UK',
							name: sanitizeString(row.TRANSLATIONS_EN_NAME),
						},
						{
							languages_code: 'es-ES',
							name: sanitizeString(row.TRANSLATIONS_ES_NAME),
						},
						{
							languages_code: 'fr-FR',
							name: sanitizeString(row.TRANSLATIONS_FR_NAME),
						},
					],
				})
				report.results.push({ ...row, IMPORT_RESULT: 'Success!' })
			} catch (error) {
				console.log(`Error writing Rarity with code ${row.CODE} -- Message: ${error.message}`)
				reportError(report, error.message, row)
			}
			await updateReport(report)
		}

		// Process rows in batches
		await handleCsvBatching(readStream, processRow)
		return report
	}

	async function importCollections(schema, accountability, stream, report) {
		const importService = new ItemsService('collections', { schema: schema, accountability: { ...accountability, admin: true } })
		const fileService = new FilesService({ schema: schema, accountability: { ...accountability, admin: true } })
		const readStream = stream.pipe(csvParser())

		const processRow = async (row) => {
			try {
				// Create collection
				await importService.createOne({
					status: sanitizeString(row.STATUS),
					slug: await sanitizeString(row.SLUG),
					collection_image: await importFile(
						row.COLLECTION_IMAGE_URL,
						row.SLUG,
						fileService
					),
					reward_image: await importFile(
						row.REWARD_IMAGE_URL,
						row.SLUG,
						fileService
					),
					translations: [
						{
							languages_code: 'en-UK',
							name: sanitizeString(row.TRANSLATIONS_EN_NAME),
							description: sanitizeString(row.TRANSLATIONS_EN_DESCRIPTION),
							reward_prompt: sanitizeString(row.TRANSLATIONS_EN_REWARD_PROMPT),
							reward_complete: sanitizeString(
								row.TRANSLATIONS_EN_REWARD_COMPLETE
							),
						},
						{
							languages_code: 'es-ES',
							name: sanitizeString(row.TRANSLATIONS_ES_NAME),
							description: sanitizeString(row.TRANSLATIONS_ES_DESCRIPTION),
							reward_prompt: sanitizeString(row.TRANSLATIONS_ES_REWARD_PROMPT),
							reward_complete: sanitizeString(
								row.TRANSLATIONS_ES_REWARD_COMPLETE
							),
						},
						{
							languages_code: 'fr-FR',
							name: sanitizeString(row.TRANSLATIONS_FR_NAME),
							description: sanitizeString(row.TRANSLATIONS_FR_DESCRIPTION),
							reward_prompt: sanitizeString(row.TRANSLATIONS_FR_REWARD_PROMPT),
							reward_complete: sanitizeString(
								row.TRANSLATIONS_FR_REWARD_COMPLETE
							),
						},
					],
				})
				report.results.push({ ...row, IMPORT_RESULT: 'Success!' })
			} catch (error) {
				console.log(`Error writing Collection with slug ${row.SLUG} -- Message: ${error.message}`)
				reportError(report, error.message, row)
			}
			await updateReport(report)
		}

		// Process rows in batches
		await handleCsvBatching(readStream, processRow)
		return report

	}

	async function importSets(schema, accountability, stream, report) {
		const importService = new ItemsService('sets', { schema: schema, accountability: { ...accountability, admin: true } })
		const collectionService = new ItemsService('collections', { schema: schema, accountability: { ...accountability, admin: true } })
		const readStream = stream.pipe(csvParser())

		// Set up relation to collections
		const collectionMap = new Map()

		const processRow = async (row) => {
			try {
				// Create set
				await importService.createOne({
					status: sanitizeString(row.STATUS),
					slug: await sanitizeString(row.SLUG),
					collection: null,
					collection: await getEntityIdByUniqueAttr({
						attrKey: 'slug',
						attrVal: row.COLLECTION_SLUG,
						itemService: collectionService,
						entityName: 'collections',
						map: collectionMap,
					}),
					translations: [
						{
							languages_code: 'en-UK',
							name: sanitizeString(row.TRANSLATIONS_EN_NAME),
						},
						{
							languages_code: 'es-ES',
							name: sanitizeString(row.TRANSLATIONS_ES_NAME),
						},
						{
							languages_code: 'fr-FR',
							name: sanitizeString(row.TRANSLATIONS_FR_NAME),
						},
					],
				})
				report.results.push({ ...row, IMPORT_RESULT: 'Success!' })
			} catch (error) {
				console.log(`Error writing Set with slug ${row.SLUG} -- Message: ${error.message}`)
				reportError(report, error.message, row)
			}
			await updateReport(report)
		}

		// Process rows in batches
		await handleCsvBatching(readStream, processRow)
		return report
	}

	async function importTags(schema, accountability, stream, report) {
		const importService = new ItemsService('tags', { schema: schema, accountability: { ...accountability, admin: true } })
		const readStream = stream.pipe(csvParser())

		// Set up relation to collections
		const processRow = async (row) => {
			try {
				// Create set
				await importService.createOne({
					slug: await sanitizeString(row.SLUG),
					translations: [
						{
							languages_code: 'en-UK',
							title: sanitizeString(row.TRANSLATIONS_EN_TITLE),
						},
						{
							languages_code: 'es-ES',
							title: sanitizeString(row.TRANSLATIONS_ES_TITLE),
						},
						{
							languages_code: 'fr-FR',
							title: sanitizeString(row.TRANSLATIONS_FR_TITLE),
						},
					],
				})
				report.results.push({ ...row, IMPORT_RESULT: 'Success!' })
			} catch (error) {
				console.log(`Error writing Tag with slug ${row.SLUG} -- Message: ${error.message}`)
				reportError(report, error.message, row)
			}
			await updateReport(report)
		}

		// Process rows in batches
		await handleCsvBatching(readStream, processRow)
		return report
	}

	async function importPackTemplates(schema, accountability, stream, report) {
		const importService = new ItemsService('pack_templates', { schema: schema, accountability: { ...accountability, admin: true } })
		const tagService = new ItemsService('tags', { schema: schema, accountability: { ...accountability, admin: true } })
		const fileService = new FilesService({ schema: schema, accountability: { ...accountability, admin: true } })
		const readStream = stream.pipe(csvParser())

		const tagMap = new Map()

		const processRow = async (row) => {
			try {
				// Create pack_template
				await importService.createOne({
					status: sanitizeString(row.STATUS),
					slug: sanitizeString(row.SLUG),
					type: sanitizeEnum(
						row.TYPE,
						['auction', 'free', 'purchase', 'redeem'],
						'TYPE'
					),
					price: sanitizeCurrency(row.PRICE, 'PRICE'),
					released_at: sanitizeTimestamp(row.RELEASED_AT, 'RELEASED_AT'),
					auction_until: sanitizeTimestamp(row.AUCTION_UNTIL, 'AUCTION_UNTIL'),
					show_nfts: sanitizeBoolean(row.SHOW_NFTS, 'SHOW_NFTS'),
					nft_order: sanitizeEnum(
						row.NFT_ORDER,
						['match', 'random'],
						'NFT_ORDER'
					),
					nft_distribution: sanitizeEnum(
						row.NFT_DISTRIBUTION,
						['one-of-each', 'random'],
						'NFT_DISTRIBUTION'
					),
					nfts_per_pack: sanitizeInteger(row.NFTS_PER_PACK, 'NFTS_PER_PACK'),
					one_pack_per_customer: sanitizeBoolean(
						row.ONE_PACK_PER_CUSTOMER,
						'ONE_PACK_PER_CUSTOMER'
					),
					allow_bid_expiration: sanitizeBoolean(
						row.ALLOW_BID_EXPIRATION,
						'ALLOW_BID_EXPIRATION'
					),
          pack_banner: await importFile(row.PACK_BANNER_URL, row.SLUG, fileService),
					pack_image: await importFile(row.PACK_IMAGE_URL, row.SLUG, fileService),
					translations: [
						{
							languages_code: 'en-UK',
							title: sanitizeString(row.TRANSLATIONS_EN_TITLE),
							subtitle: sanitizeString(row.TRANSLATIONS_EN_SUBTITLE),
							body: sanitizeString(row.TRANSLATIONS_EN_BODY),
						},
						{
							languages_code: 'es-ES',
							title: sanitizeString(row.TRANSLATIONS_ES_TITLE),
							subtitle: sanitizeString(row.TRANSLATIONS_ES_SUBTITLE),
							body: sanitizeString(row.TRANSLATIONS_ES_BODY),
						},
						{
							languages_code: 'fr-FR',
							title: sanitizeString(row.TRANSLATIONS_FR_TITLE),
							subtitle: sanitizeString(row.TRANSLATIONS_FR_SUBTITLE),
							body: sanitizeString(row.TRANSLATIONS_FR_BODY),
						},
					],
					tags: await Promise.all(row.TAGS.split('|').map(async (slug, index) => {
						const sanitizedSlug = sanitizeString(slug)

						await getEntityIdByUniqueAttr({
							attrKey: 'slug',
							attrVal: sanitizedSlug,
							itemService: tagService,
							entityName: 'tags',
							map: tagMap
						})

						if (tagMap.get(sanitizedSlug)) return { sort: index + 1, tags_id: tagMap.get(sanitizedSlug) }
					}))
				})
				report.results.push({ ...row, IMPORT_RESULT: 'Success!' })
			} catch (error) {
				console.log(`Error writing Pack Template with slug ${row.SLUG} -- Message: ${error.message}`)
				reportError(report, error.message, row)
			}
			await updateReport(report)
		}

		// Process rows in batches
		await handleCsvBatching(readStream, processRow)
		return report
	}

	async function importNftTemplates(schema, accountability, stream, report) {
		const importService = new ItemsService('nft_templates', { schema: schema, accountability: { ...accountability, admin: true } })
		const setService = new ItemsService('sets', { schema: schema, accountability: { ...accountability, admin: true } })
		const tagService = new ItemsService('tags', { schema: schema, accountability: { ...accountability, admin: true } })
		const rarityService = new ItemsService('rarities', { schema: schema, accountability: { ...accountability, admin: true } })
		const collectionService = new ItemsService('collections', { schema: schema, accountability: { ...accountability, admin: true } })
		const packService = new ItemsService('pack_templates', { schema: schema, accountability: { ...accountability, admin: true } })
		const fileService = new FilesService({ schema: schema, accountability: { ...accountability, admin: true } })
		const readStream = stream.pipe(csvParser())

		// Set up relation to other entities
		const rarityMap = new Map()
		const packMap = new Map()
		const setMap = new Map()
		const collectionMap = new Map()
		const tagMap = new Map()

		const processRow = async (row) => {
			try {
				// Create nft_template
				await importService.createOne({
					status: sanitizeString(row.STATUS),
					pack_template: await getEntityIdByUniqueAttr({
						attrKey: 'slug',
						attrVal: row.PACK_TEMPLATE_SLUG,
						itemService: packService,
						entityName: 'pack_templates',
						map: packMap,
					}),
					set: await getEntityIdByUniqueAttr({
						attrKey: 'slug',
						attrVal: row.SET_SLUG,
						itemService: setService,
						entityName: 'sets',
						map: setMap,
					}),
					collection: await getEntityIdByUniqueAttr({
						attrKey: 'slug',
						attrVal: row.COLLECTION_SLUG,
						itemService: collectionService,
						entityName: 'collections',
						map: collectionMap,
					}),
					unique_code: sanitizeString(row.UNIQUE_CODE),
					total_editions: sanitizeInteger(row.TOTAL_EDITIONS, 'TOTAL_EDITIONS'),
					rarity: await getEntityIdByUniqueAttr({
						attrKey: 'code',
						attrVal: row.RARITY_CODE,
						itemService: rarityService,
						entityName: 'rarities',
						map: rarityMap,
					}),
					preview_image: await importFile(
						row.PREVIEW_IMAGE_URL,
						row.UNIQUE_CODE,
						fileService
					),
					preview_video: await importFile(
						row.PREVIEW_VIDEO_URL,
						row.UNIQUE_CODE,
						fileService
					),
					preview_audio: await importFile(
						row.PREVIEW_AUDIO_URL,
						row.UNIQUE_CODE,
						fileService
					),
					asset_file: await importFile(
						row.ASSET_FILE_URL,
						row.UNIQUE_CODE,
						fileService
					),
					translations: [
						{
							languages_code: 'en-UK',
							title: sanitizeString(row.TRANSLATIONS_EN_TITLE),
							subtitle: sanitizeString(row.TRANSLATIONS_EN_SUBTITLE),
							body: sanitizeString(row.TRANSLATIONS_EN_BODY),
						},
						{
							languages_code: 'es-ES',
							title: sanitizeString(row.TRANSLATIONS_ES_TITLE),
							subtitle: sanitizeString(row.TRANSLATIONS_ES_SUBTITLE),
							body: sanitizeString(row.TRANSLATIONS_ES_BODY),
						},
						{
							languages_code: 'fr-FR',
							title: sanitizeString(row.TRANSLATIONS_FR_TITLE),
							subtitle: sanitizeString(row.TRANSLATIONS_FR_SUBTITLE),
							body: sanitizeString(row.TRANSLATIONS_FR_BODY),
						},
					],
					tags: await Promise.all(row.TAGS.split('|').map(async (slug, index) => {
						const sanitizedSlug = sanitizeString(slug)

						await getEntityIdByUniqueAttr({
							attrKey: 'slug',
							attrVal: sanitizedSlug,
							itemService: tagService,
							entityName: 'tags',
							map: tagMap
						})

						if (tagMap.get(sanitizedSlug)) return { sort: index + 1, tags_id: tagMap.get(sanitizedSlug) }
					}))
				})
				report.results.push({ ...row, IMPORT_RESULT: 'Success!' })
			} catch (error) {
				console.log(`Error writing NFT Template with unique code ${row.UNIQUE_CODE}. -- Message: ${error.message}`)
				reportError(report, error.message, row)
			}
			await updateReport(report)
		}

		// Process rows in batches
		console.time('NFT Templates imported in')
		await handleCsvBatching(readStream, processRow)
		console.timeEnd('NFT Templates imported in')
		return report
	}

	async function updateNftTemplates(schema, accountability, stream, report) {
		const fileService = new FilesService({ schema: schema, accountability: { ...accountability, admin: true } })
		const nftService = new ItemsService('nft_templates', { schema: schema, accountability: { ...accountability, admin: true } })
		const mainMap = prepareMainMap()

		//header row:
		//field[0] = UNIQUE_CODE
		//field[1] = FIELD_NAME
		//field[2] = FIELD_DATA
		const readStream = stream.pipe(csvParser())

		const processRow = async (row) => {
			try {
				const queryResult = await nftService.readByQuery({
					filter: {
						_and: [
							{ unique_code: { _eq: row.UNIQUE_CODE } }
						],
					},
				})
				if (!queryResult || queryResult.length == 0) {
					throw new Error(`No existing NFT found for unique_code ${row.UNIQUE_CODE}`)
				}

				const nft = queryResult[0]

				let fieldDataValue = ''
				switch (row.FIELD_NAME) {
					case 'preview_image':
					case 'preview_video':
					case 'preview_audio':
					case 'asset_file':
						//these are all urls, so importFile will sanitize the data
						console.log(`Updating ${row.FIELD_NAME} for unique_code ${row.UNIQUE_CODE}`)
						fieldDataValue = await importFile(
							row.FIELD_DATA,
							row.UNIQUE_CODE,
							fileService
						)
						break
					case 'rarity':
						console.log(`Updating ${row.FIELD_NAME} for unique_code ${row.UNIQUE_CODE}`)
						fieldDataValue = await getEntityIdByUniqueAttr({
							attrKey: 'code',
							attrVal: row.FIELD_DATA,
							itemService: new ItemsService('rarities', { schema: schema, accountability: { ...accountability, admin: true } }),
							entityName: 'rarities',
							map: mainMap.get(row.FIELD_NAME),
						})
						break
					case 'set':
					case 'collection':
						console.log(`Updating ${row.FIELD_NAME} for unique_code ${row.UNIQUE_CODE}`)
						fieldDataValue = await getEntityIdByUniqueAttr({
							attrKey: 'slug',
							attrVal: row.FIELD_DATA,
							itemService: new ItemsService(`${row.FIELD_NAME}s`, { schema: schema, accountability: { ...accountability, admin: true } }),
							entityName: `${row.FIELD_NAME}s`,
							map: mainMap.get(row.FIELD_NAME),
						})
						break
					default:
						throw new Error(`Field name ${row.FIELD_NAME} is not permitted for updates.`)
				}

				await nftService.updateOne(nft.id,
					{
						[`${row.FIELD_NAME}`]: fieldDataValue
					}
				)
				report.results.push({ ...row, IMPORT_RESULT: 'Success!' })
			} catch (error) {
				reportError(report, error.message, row)
			}
			await updateReport(report)
		}

		// Process rows in batches
		console.time('NFT Templates updated in')
		await handleCsvBatching(readStream, processRow)
		console.timeEnd('NFT Templates updated in')
		return report
	}

	async function updateReport(report) {
		report.processed++
		if (report.processed % 20 === 0) {
			console.log('processReportResults: INCREMENTAL UPDATE...')
			const importService = new ItemsService('import_files', { schema: report.schema })
			await importService.updateOne(report.key, {
				num_processed: report.processed
			})
		}
	}

	function prepareMainMap() {
		const rarityMap = new Map()
		const pack_templateMap = new Map()
		const setMap = new Map()
		const collectionMap = new Map()

		const mainMap = new Map()
		mainMap.set('rarity', rarityMap)
		mainMap.set('pack_template', pack_templateMap)
		mainMap.set('set', setMap)
		mainMap.set('collection', collectionMap)
		return mainMap
	}

	action('import_files.items.update', async (meta, context) => {
		console.log('UPDATE META: ', meta)
		await runImport(meta, context)
	});
	action('import_files.items.create', async (meta, context) => {
		console.log('CREATE META: ', meta)
		await runImport(meta, context)
	});

};
