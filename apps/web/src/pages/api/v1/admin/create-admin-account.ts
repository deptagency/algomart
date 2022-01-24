import { DEFAULT_LOCALE, FirebaseClaim } from '@algomart/schemas'
import { BadRequest, Unauthorized } from 'http-errors'
import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import configureAdmin from '@/clients/firebase-admin-client'
import { Environment } from '@/environment'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'
import validateBodyMiddleware, {
  ExtractBodyType,
} from '@/middleware/validate-body-middleware'
import { validateCustomClaim } from '@/utils/auth-validation'

type BodyType = ExtractBodyType<typeof validateCustomClaim>

const handler = createHandler()
handler.use(authMiddleware()).use(userMiddleware())

// #region Update claims
handler.post(
  validateBodyMiddleware(validateCustomClaim),
  async (request: NextApiRequestApp<BodyType>, response: NextApiResponse) => {
    if (!request.user.externalId) {
      throw new BadRequest('No external ID provided')
    }

    const body = request.validResult.value as BodyType
    const email = Environment.firebaseAdminEmail
    const passphrase = Environment.firebasePassphrase
    const username = Environment.firebaseUsername
    const locale =
      request.headers['accept-language']?.split(',')[0] || DEFAULT_LOCALE
    let user, adminUser

    if (!body.role) {
      throw new BadRequest('No role provided')
    }
    // Check permissions (not using admin middleware)
    const admin = configureAdmin()
    const firebaseUser = await admin.auth().getUser(request.user.externalId)
    const claims = firebaseUser.customClaims

    // If the user is not admin OR the logged in user isn't the admin email, throw error
    const isAdminUser =
      !!claims && Object.keys(claims).includes(FirebaseClaim.admin)
    const isLoggedInAdminUser =
      Environment.firebaseAdminEmail === request.user.email
    if (!isAdminUser && !isLoggedInAdminUser) {
      throw new Unauthorized('User does not have admin permissions')
    }

    // Check if admin user exists
    try {
      adminUser = await admin.auth().getUserByEmail(email)
    } catch {
      // @TODO: Does error on not found?
      throw new BadRequest('Problem finding Firebase admin account')
    }

    if (!adminUser) {
      try {
        // If does not exist, create admin user
        adminUser = await admin.auth().createUser({
          email: email,
          emailVerified: true,
          disabled: false,
        })
      } catch {
        throw new BadRequest('Unable to create Firebase account')
      }
    }

    try {
      user = await ApiClient.instance.getAccountByExternalId(request.token.uid)
    } catch {
      // @TODO: Does error on not found?
      throw new BadRequest('Problem finding account in database')
    }

    if (!user) {
      try {
        user = await ApiClient.instance.createAccount({
          email,
          externalId: adminUser.uid,
          locale,
          passphrase,
          username,
        })
      } catch {
        throw new BadRequest('Unable to create account in database')
      }
    }

    if (!user) {
      throw new BadRequest('Unable to create account')
    }

    // Set admin user claims
    await admin.auth().setCustomUserClaims(adminUser.uid, {
      [request.body.role]: true,
    })

    response.status(204).end()
  }
)
// #endregion Update claims

export default handler
