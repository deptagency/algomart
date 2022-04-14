import { NextApiResponse } from 'next'

import { Environment, PublicConfig } from '@/environment'
import createHandler, { NextApiRequestApp } from '@/middleware'

const handler = createHandler()

handler.get(async (_: NextApiRequestApp, response: NextApiResponse) => {
  const config: PublicConfig = {
    chainType: Environment.chainType,
    algoExplorerBaseUrl: Environment.algoExplorerBaseUrl,
    currency: Environment.currency,
    isWireEnabled: Environment.isWireEnabled,
    firebaseConfig: Environment.firebaseConfig,
    isCryptoEnabled: Environment.isCryptoEnabled,
    isProduction: Environment.isProduction,
    stripeKey: Environment.stripeKey,
  }
  response.json(config)
})

export default handler
