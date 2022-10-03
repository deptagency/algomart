import { FirebaseClaim } from '@algomart/schemas'
import Cookies from 'cookies'
import { GetServerSidePropsContext } from 'next'
import { IncomingMessage, ServerResponse } from 'node:http'

import { ApiClient } from '@/clients/api-client'
import configureAdmin from '@/clients/firebase-admin-client'
import { AppConfig } from '@/config'
import { TOKEN_COOKIE_NAME } from '@/contexts/auth-context'
import { urlFor, urls } from '@/utils/urls'

export function getTokenFromCookie(
  request: IncomingMessage,
  response: ServerResponse
) {
  const cookies = new Cookies(request, response)
  const token = cookies.get(TOKEN_COOKIE_NAME)
  return token
}

export async function getAuthenticatedUser(context: GetServerSidePropsContext) {
  const token = getTokenFromCookie(context.req, context.res)

  if (!token) {
    return false
  }

  // Verify token
  const admin = configureAdmin()
  const decoded = await admin
    .auth()
    .verifyIdToken(token)
    .catch(() => null)

  if (!decoded) {
    return false
  }

  const client = new ApiClient(AppConfig.apiURL, token)
  const user = await client.getAccountProfile()

  return user
}

export async function handleUnauthenticatedRedirect(urlPath: string) {
  return {
    redirect: {
      destination: urlFor(urls.login, null, { redirect: urlPath }),
      permanent: false,
    },
  }
}

export async function isAuthenticatedUserAdmin(
  context: GetServerSidePropsContext
) {
  const token = getTokenFromCookie(context.req, context.res)

  if (!token) {
    return false
  }

  // Verify token
  const admin = configureAdmin()
  const decoded = await admin
    .auth()
    .verifyIdToken(token)
    .catch(() => null)

  if (!decoded) {
    return false
  }

  const client = new ApiClient(AppConfig.apiURL, token)
  const user = await client.getAccountProfile()

  if (!user) {
    return false
  }

  // Check user
  const firebaseUser = await admin.auth().getUser(decoded.uid)

  // Check permissions
  const claims = firebaseUser.customClaims

  // Only allow if user has admin claim
  const isAdminUser = claims?.[FirebaseClaim.admin]
  if (!isAdminUser) {
    return false
  }

  return user
}
