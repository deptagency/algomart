import axios from 'axios'

export default ({ filter, action }, { services, exceptions }) => {
	const { ItemsService } = services
	const { InvalidPayloadException } = exceptions;

	const setVerificationStatus = async ({ payload, keys }, { schema, accountability }) => {
		if (payload.newVerificationStatus) {

			//Get the full item
			const itemService = new ItemsService('kyc_management', { schema: schema, accountability: { ...accountability, admin: true } })
			const thisUser = await itemService.readOne(keys[0])
			if (thisUser) {
				const path = `accounts/externalId/${thisUser.externalId}`
				console.log('api verification status update to: ', path)
				const response = await axiosPatch(path, {
					verificationStatus: thisUser.newVerificationStatus
				})
				console.log('api verification status update response:', response.status)
			}
		}
	}

	const axiosPatch = async (path, body) => {
		const response = await axios.patch(process.env.API_URL + "/" + path, body, {
			headers: {
				'Authorization': 'Bearer ' + process.env.API_KEY
			}
		}).catch(function (error) {
			console.log(error)
		})
		return response
	}

	const validatePayload = async (payload, meta) => {
		if (payload.newVerificationStatus) {
			if (meta.keys && meta.keys.length > 1) {
				throw new InvalidPayloadException('Batch editing of new verification statuses is not supported')
			}
		}
	}

	action('kyc_management.items.update', async (meta, context) => {
		console.log('kyc_management.items.update update action meta: ' + JSON.stringify(meta))
		await setVerificationStatus(meta, context)
	})

	filter('kyc_management.items.update', async (payload, meta) => {
		console.log('kyc_management.items.update filter payload: ', JSON.stringify(payload))
		console.log('kyc_management.items.update filter meta: ', JSON.stringify(meta))
		await validatePayload(payload, meta)
	})

}