import { NextApiResponse } from 'next'

import createHandler, { NextApiRequestApp } from '@/middleware'
import adminMiddleware from '@/middleware/admin-middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware()).use(adminMiddleware())

handler.get(async (request: NextApiRequestApp, response: NextApiResponse) => {
  // @TODO: Request payments when endpoint is available
})

export default handler
