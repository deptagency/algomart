import { BadRequest } from 'http-errors'
import { NextApiResponse } from 'next'
import { v4 as uuid } from 'uuid'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'
import validateBodyMiddleware, {
  ExtractBodyType,
} from '@/middleware/validate-body-middleware'
import { validateBankAccount } from '@/utils/purchase-validation'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware())

type BodyType = ExtractBodyType<typeof validateBankAccount>

handler.post(
  validateBodyMiddleware(validateBankAccount),
  async (request: NextApiRequestApp<BodyType>, response: NextApiResponse) => {
    const body = request.validResult.value as BodyType

    // Create bank account
    const bankAccount = await ApiClient.instance.createBankAccount({
      idempotencyKey: uuid(),
      accountNumber: body.accountNumber,
      routingNumber: body.routingNumber,
      billingDetails: {
        name: body.fullName,
        city: body.city,
        country: body.country,
        line1: body.address1,
        line2: body.address2 || '',
        district: body.state,
        postalCode: body.zipCode,
      },
      bankAddress: {
        bankName: body.bankName,
        city: body.bankCity,
        country: body.bankCountry,
        line1: body.bankAddress1,
        line2: body.bankAddress2 || '',
        district: body.bankDistrict,
      },
      ownerExternalId: request.user.externalId,
    })

    const bankAccountId = bankAccount?.id
    if (!bankAccountId) {
      throw new BadRequest('Bank account could not be created')
    }

    response.status(201).json(bankAccount)
  }
)

export default handler
