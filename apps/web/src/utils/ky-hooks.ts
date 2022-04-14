export async function setBearerToken(request: Request) {
  try {
    const { getAuth } = await import('firebase/auth')
    const auth = getAuth()
    // Force refresh of Firebase token on the first render
    const token = await auth.currentUser?.getIdToken(true)
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`)
    }
  } catch {
    // ignore, firebase probably not initialized
  }
}
