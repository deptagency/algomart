import { BadRequest, NotFound } from 'http-errors'
import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'
import validateBodyMiddleware, {
  ExtractBodyType,
} from '@/middleware/validate-body-middleware'
import { isGreaterThanOrEqual } from '@/utils/format-currency'
import { validateBidForPack } from '@/utils/marketplace-validation'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware())

type BodyType = ExtractBodyType<typeof validateBidForPack>

handler.post(
  validateBodyMiddleware(validateBidForPack),
  async (request: NextApiRequestApp<BodyType>, response: NextApiResponse) => {
    const { amount, packId } = request.validResult.value as BodyType

    // Get corresponding pack and its auction data
    const pack = await ApiClient.instance.packWithCollectibles({
      packId,
    })

    if (!pack) throw new NotFound('Pack not found')

    const { activeBid } = await ApiClient.instance.getAuctionPack(
      pack.templateId
    )

    // Validate the bid is higher than a previous active bid
    if (activeBid && isGreaterThanOrEqual(activeBid.amount, amount)) {
      throw new BadRequest('Bid is not higher than the previous bid')
    }

    // Create the bid
    const result = await ApiClient.instance.createPackBid({
      amount,
      externalId: request.user.externalId,
      packId,
    })

    if (!result) {
      response.status(201).send(false)
    }

    response.status(201).send(true)
  }
)

export default handler
