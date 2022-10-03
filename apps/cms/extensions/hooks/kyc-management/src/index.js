import axios from 'axios'
import crypto from 'node:crypto'

export default ({ schedule }, context) => {
	const {
		services: { ItemsService, PresetsService, PermissionsService },
		database: knex, getSchema
	} = context;

	const upsertKYCUsers = async () => {
		const schema = await getSchema()
		createKYCPreset(knex, schema, PresetsService)
		createKYCRole(knex, schema, ItemsService, PermissionsService)

		const kycService = new ItemsService('kyc_management', { knex, schema: schema })

		/**
		 * Using a placeholder to support the case of multiple Directus instances.
		 * To avoid overlapping runs.
		 */
		const existingPlaceholder = await kycService.readByQuery({
			filter: { externalId: { _eq: 'Placeholder' } }
		})
		if (existingPlaceholder && existingPlaceholder.length > 0) {
			console.log('Another run in progress, exiting')
			return
		}
		const placeholderKey = await kycService.createOne({
			notes: 'Placeholder',
			externalId: 'Placeholder'
		})

		const response = await axiosGet('admin/accounts/verified?verificationStatus=manual-review')

		if (response && response.data && response.data.users) {
			console.log('Processing users for kyc management: ', response.data.total)
			for (const user of response.data.users) {
				const kycUser = {
					username: user.username,
					verificationStatus: user.verificationStatus,
					applicantId: user.applicantId,
					lastWorkflowRunId: user.lastWorkflowRunId,
					lastVerified: user.lastVerified,
					externalId: user.externalId
				}
				const existingUser = await kycService.readByQuery({
					filter: { externalId: { _eq: user.externalId } }
				})
				if (existingUser && existingUser.length === 1) {
					kycUser.id = existingUser[0].id
					kycUser.status = existingUser[0].status
					kycUser.newVerificationStatus = null
					kycUser.notes = existingUser[0].notes
				} else {
					kycUser.status = 'active'
				}

				await kycService.upsertOne(kycUser)
			}
		}
		await kycService.deleteOne(placeholderKey)
	}

	const axiosGet = async (path) => {
		const response = await axios.get(process.env.API_URL + "/" + path, {
			headers: {
				'Authorization': 'Bearer ' + process.env.API_KEY
			}
		}).catch(function (error) {
			console.log('axiosGet error: ', error)
		})
		return response
	}

	/**
	 * Creating a role for users that only do KYC management. This is the only
	 * collection they will have access to.
	 */
	async function createKYCRole(database, schema, ItemsService, PermissionsService) {
		const itemService = new ItemsService('directus_roles', { database, schema: schema })

		const existingRole = await itemService.readByQuery({
			filter: {
				_and: [
					{ name: { _eq: 'KYC' } }
				],
			},
		})

		if (!existingRole[0]) {
			const roleId = await itemService.createOne({
				id: crypto.randomUUID(),
				name: 'KYC',
				description: 'A role for users that only handle KYC management',
				icon: 'supervised_user_circle',
				enforce_tfa: false,
				admin_access: false,
				app_access: true
			})
			const permissionsService = new PermissionsService({
				database: database,
				schema: schema,
			})
			await permissionsService.createOne({
				role: roleId,
				collection: 'kyc_management',
				action: 'read',
				fields: '*',
				permissions: {}
			})
			await permissionsService.createOne({
				role: roleId,
				collection: 'kyc_management',
				action: 'update',
				fields: '*',
				permissions: {}
			})
			await permissionsService.createOne({
				role: roleId,
				collection: 'kyc_management',
				action: 'delete',
				fields: '*',
				permissions: {}
			})
		}
	}

	/**
	 * If a preset for kyc_management doesn't exist we create one. This should only happen once and
	 * provides the default collection display for kyc_management
	 */
	async function createKYCPreset(database, schema, PresetsService) {
		const presetService = new PresetsService({
			database: database,
			schema: schema,
		})
		const existingPreset = await presetService.readByQuery({
			filter: {
				_and: [
					{ collection: { _eq: 'kyc_management' } },
					{ role: { _null: true } },
					{ user: { _null: true } },
				],
			},
		})
		if (!existingPreset[0]) {
			const maxPresetId = await presetService.readByQuery({
				fields: ['id'],
				aggregate: { max: ['id'] },
			})
			let newPresetId = 1
			if (maxPresetId[0]) {
				newPresetId = maxPresetId[0].max.id + 1
			}
			await presetService.createOne({
				id: newPresetId,
				collection: 'kyc_management',
				layout: 'tabular',
				layout_query: {
					tabular: {
						page: 1,
						fields: [
							'status',
							'username',
							'verificationStatus',
							'newVerificationStatus',
							'lastVerified'
						],
						sort: ['-lastVerified'],
					},
				},
				layout_options: {
					tabular: {
						widths: {
							status: 190,
							username: 180,
							verificationStatus: 230,
							newVerificationStatus: 230,
							lastVerified: 209
						},
					},
				},
			})
		}
	}

	schedule('*/15 * * * *', async () => {
		await upsertKYCUsers()
	})
}
