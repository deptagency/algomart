import { DEFAULT_LOCALE } from '@algomart/schemas'
import { BadRequest } from 'http-errors'
import { NextApiRequest, NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware, { WithToken } from '@/middleware/auth-middleware'
import validateBodyMiddleware, {
  ExtractBodyType,
} from '@/middleware/validate-body-middleware'
import { validateUserRegistration } from '@/utils/auth-validation'

const handler = createHandler()
handler.use(authMiddleware())

type BodyType = ExtractBodyType<typeof validateUserRegistration>

handler.post(
  validateBodyMiddleware(validateUserRegistration),
  async (request: NextApiRequestApp<BodyType>, response: NextApiResponse) => {
    const body = request.validResult.value as BodyType
    const locale =
      request.headers['accept-language']?.split(',')[0] || DEFAULT_LOCALE

    const user = await ApiClient.instance.getAccountByExternalId(
      request.token.uid
    )

    if (user) {
      throw new BadRequest('Account is already configured')
    }

    try {
      await ApiClient.instance.createAccount({
        email: body.email,
        externalId: request.token.uid,
        locale,
        passphrase: body.passphrase,
        username: body.username,
      })
    } catch {
      throw new BadRequest('Could not create account')
    }

    response.status(204).end()
  }
)

handler.get(
  async (request: NextApiRequest & WithToken, response: NextApiResponse) => {
    const user = await ApiClient.instance.getAccountByExternalId(
      request.token.uid
    )
    if (!user) throw new BadRequest('Account is not configured')
    response.json(user)
  }
)

// TODO: for managing one's profile
// handler.patch(async (req: NextApiRequestApp, res: NextApiResponse) => {})
// handler.put(async (req: NextApiRequestApp, res: NextApiResponse) => {})

export default handler
