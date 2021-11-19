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

      const { status } = await poll(
        async () => await collectibleService.transferStatus(packId),
        (result) =>
          !result.status.every(
            (x) => x.status === AlgorandTransactionStatus.Confirmed
          ) ||
          !result.status.some(
            (x) => x.status === AlgorandTransactionStatus.Failed
          ),
        1000
      )

      if (status.some((x) => x.status === AlgorandTransactionStatus.Failed)) {
        setStatus(TransferPackStatus.Error)
        return
      }

      setStatus(TransferPackStatus.Success)
    },
    [packId]
  )

  const reset = useCallback(() => {
    setStatus(TransferPackStatus.Idle)
  }, [])

  return [transfer, status, reset]
}
