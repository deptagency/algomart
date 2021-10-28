import type { NextApiRequest, NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler from '@/middleware'
import validateBodyMiddleware, {
  ExtractBodyType,
  WithValidResult,
} from '@/middleware/validate-body-middleware'
import { validateUsername } from '@/utils/auth-validation'

const handler = createHandler()

type BodyType = ExtractBodyType<typeof validateUsername>

handler.post(
  validateBodyMiddleware(validateUsername),
  async (
    request: NextApiRequest & WithValidResult<BodyType>,
    response: NextApiResponse
  ) => {
    const body = request.validResult.value as BodyType
    const result = await ApiClient.instance.verifyUsername({
      username: body.username,
    })
    return response.json(result)
  }
)

export default handler
