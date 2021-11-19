import { AlgorandTransactionStatus } from '@algomart/schemas'
import { useCallback, useState } from 'react'

import collectibleService from '@/services/collectible-service'
import { poll } from '@/utils/poll'

export enum TransferPackStatus {
  Idle = 'idle',
  Transferring = 'transferring',
  Success = 'success',
  Error = 'error',
}

export function useTransferPack(
  packId: string
): [(passphrase: string) => Promise<void>, TransferPackStatus, () => void] {
  const [status, setStatus] = useState(TransferPackStatus.Idle)

  const transfer = useCallback(
    async (passphrase: string) => {
      setStatus(TransferPackStatus.Transferring)

      const result = await collectibleService.transfer(packId, passphrase)

      if (!result) {
        setStatus(TransferPackStatus.Error)
        return
      }

      await poll(
        async () => await collectibleService.transferStatus(packId),
        (result) => {
          // Something failed
          if (
            result.status.some(
              ({ status }) => status === AlgorandTransactionStatus.Failed
            )
          ) {
            setStatus(TransferPackStatus.Error)
            return false
          }

          // All succeeded
          if (
            result.status.every(
              ({ status }) => status === AlgorandTransactionStatus.Confirmed
            )
          ) {
            setStatus(TransferPackStatus.Success)
            return false
          }

          // One or more still pending
          return true
        },
        1000
      )
    },
    [packId]
  )

  const reset = useCallback(() => {
    setStatus(TransferPackStatus.Idle)
  }, [])

  return [transfer, status, reset]
}
