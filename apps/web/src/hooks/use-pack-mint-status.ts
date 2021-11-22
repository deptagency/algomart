import { MintPackStatus } from '@algomart/schemas'
import { useState } from 'react'

import { useInterval } from './use-interval'

import { useAuth } from '@/contexts/auth-context'
import collectibleService from '@/services/collectible-service'

export function usePackMintStatus(packId: string) {
  const [status, setStatus] = useState<MintPackStatus>()
  const auth = useAuth()

  useInterval(
    async () => {
      if (!auth.user) return
      setStatus(await collectibleService.mintStatus(packId))
    },
    status === MintPackStatus.Minted ? null : 1000
  )

  return status
}
