import * as jwt from 'jsonwebtoken'

export async function setBearerToken(request: Request) {
  try {
    const TEN_MIN_IN_SECONDS = 60 * 10
    const CURRENT_TIME_IN_SECONDS = Date.now() / 1000
    const { getAuth } = await import('firebase/auth')
    const auth = getAuth()
    let token = await auth.currentUser?.getIdToken()
    const { exp } = jwt.decode(token, { json: true })

    // If expiring within 10 minutes, force refresh
    if (CURRENT_TIME_IN_SECONDS > exp - TEN_MIN_IN_SECONDS) {
      token = await auth.currentUser?.getIdToken(true)
    }

    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`)
    }
  } catch {
    // ignore, firebase probably not initialized
  }
}
