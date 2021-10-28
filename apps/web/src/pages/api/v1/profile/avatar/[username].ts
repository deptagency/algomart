import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import configureAdmin from '@/clients/firebase-admin-client'
import createHandler, { NextApiRequestApp } from '@/middleware'

const handler = createHandler()

// 1x1 png with #808080 fill
const fallback = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNs+A8AAgUBgQvw1B0AAAAASUVORK5CYII=',
  'base64'
)

function sendFallback(response: NextApiResponse) {
  response.setHeader('Content-Type', 'image/png')
  response.setHeader('Content-Length', fallback.length)
  response.send(fallback)
}

handler.get(async (request: NextApiRequestApp, response: NextApiResponse) => {
  const username = request.query.username
  if (typeof username !== 'string') return sendFallback(response)
  const user = await ApiClient.instance.getAccountByUsername(username)
  if (!user) return sendFallback(response)
  const admin = configureAdmin()
  const firebaseUser = await admin.auth().getUser(user.externalId)
  if (!firebaseUser.photoURL) return sendFallback(response)
  response.redirect(firebaseUser.photoURL)
})

export default handler
