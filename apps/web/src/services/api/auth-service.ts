import { FirebaseClaim } from '@algomart/schemas'
import Cookies from 'cookies'
import { GetServerSidePropsContext } from 'next'

import { ApiClient } from '@/clients/api-client'
import configureAdmin from '@/clients/firebase-admin-client'
import { TOKEN_COOKIE_NAME } from '@/contexts/auth-context'
import { urls } from '@/utils/urls'

export async function getAuthenticatedUser({
  req,
  res,
}: GetServerSidePropsContext) {
  const cookies = new Cookies(req, res)
  const token = cookies.get(TOKEN_COOKIE_NAME)

  if (!token) {
    return false
  }

  const decoded = await configureAdmin()
    .auth()
    .verifyIdToken(token)
    .catch(() => null)

  if (!decoded) {
    return false
  }

  const user = await ApiClient.instance.getAccountByExternalId(decoded.uid)

  return user
}

export async function getProfileImageForUser(
  firebaseUserId: string
): Promise<string | null> {
  const user = await configureAdmin()
    .auth()
    .getUser(firebaseUserId)
    .catch(() => null)

  if (!user || !user.photoURL) {
    return null
  }

  return user.photoURL
}

export async function handleUnauthenticatedRedirect(urlPath: string) {
  return {
    redirect: {
      destination: `${urls.login}?redirect=${urlPath}`,
      permanent: false,
    },
  }
}

export async function isAuthenticatedUserAdmin({
  req,
  res,
}: GetServerSidePropsContext) {
  const cookies = new Cookies(req, res)
  const token = cookies.get(TOKEN_COOKIE_NAME)
  const admin = configureAdmin()

  if (!token) {
    return false
  }

  // Verify token
  const decoded = await admin
    .auth()
    .verifyIdToken(token)
    .catch(() => null)

  if (!decoded) {
    return false
  }

  const user = await ApiClient.instance.getAccountByExternalId(decoded.uid)

  if (!user) {
    return false
  }

  // Check user
  const firebaseUser = await admin.auth().getUser(decoded.uid)

  // Check permissions
  const claims = firebaseUser.customClaims

  // If the user is not admin, throw error
  const isAdminUser =
    !!claims && Object.keys(claims).includes(FirebaseClaim.admin)
  if (!isAdminUser) {
    return false
  }

  return user
}
