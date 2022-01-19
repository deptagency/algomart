import { DEFAULT_LOCALE } from '@algomart/schemas'
import { BadRequest } from 'http-errors'
import { NextApiRequest, NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import configureAdmin from '@/clients/firebase-admin-client'
import { useClaims } from '@/hooks/use-user-claims'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware, { WithToken } from '@/middleware/auth-middleware'
import validateBodyMiddleware, {
  ExtractBodyType,
} from '@/middleware/validate-body-middleware'
import { validateUserRegistration } from '@/utils/auth-validation'

const handler = createHandler()
handler.use(authMiddleware())

type BodyType = ExtractBodyType<typeof validateUserRegistration>

// #region Create account and set claims
handler.post(
  validateBodyMiddleware(validateUserRegistration),
  async (request: NextApiRequestApp<BodyType>, response: NextApiResponse) => {
    const { user } = request
    if (user) {
      throw new BadRequest('Account is already configured')
    }
    const admin = configureAdmin()
    const firebaseUser = await admin.auth().getUser(user.externalId)
    return firebaseUser

    // try {
    //   await ApiClient.instance.createAccount({
    //     email: body.email,
    //     externalId: request.token.uid,
    //     locale,
    //     passphrase: body.passphrase,
    //     username: body.username,
    //   })
    // } catch {
    //   throw new BadRequest('Could not create account')
    // }

    // response.status(204).end()
  }
)
// #endregion Create account and set claims

// #region Get claims for logged in user
handler.get(async (request: NextApiRequestApp, response: NextApiResponse) => {
  const { user } = request
  console.log('user', user)
  if (user) {
    throw new BadRequest('Account is already configured')
  }
  const admin = configureAdmin()
  const firebaseUser = await admin.auth().getUser(user.externalId)
  return firebaseUser
  // const user = await ApiClient.instance.getAccountByExternalId(
  //   request.token.uid
  // )
  // if (!user) throw new BadRequest('Account is not configured')
  // response.json(user)
  // console.log('user:', user)
  // response.json(user)
})
// #endregion Get claims for logged in user

// #region Update claims
handler.patch(
  async (request: NextApiRequest & WithToken, response: NextApiResponse) => {
    const user = await ApiClient.instance.getAccountByExternalId(
      request.token.uid
    )
    if (!user) throw new BadRequest('Account is not configured')
    response.json(user)
  }
)
// #endregion Update claims

export default handler
