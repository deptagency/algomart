import {
  AlgorandTransactionStatus,
  TransferPackStatusList,
} from '@algomart/schemas'
import { useMemo } from 'react'

import { useAuth } from '@/contexts/auth-context'
import { useAPI } from '@/utils/react-query'
import { urlFor, urls } from '@/utils/urls'

export enum TransferPackStatus {
  Idle = 'idle',
  Minting = 'minting',
  Transferring = 'transferring',
  Success = 'success',
  Error = 'error',
}

function isPending({ status }: TransferPackStatusList): boolean {
  return status.some(
    ({ status }) => status === AlgorandTransactionStatus.Pending
  )
}

function hasError({ status }: TransferPackStatusList): boolean {
  return status.some(
    ({ status }) => status === AlgorandTransactionStatus.Failed
  )
}

function isConfirmed({ status }: TransferPackStatusList): boolean {
  return status.every(
    ({ status }) => status === AlgorandTransactionStatus.Confirmed
  )
}

function hasNoStatus({ status }: TransferPackStatusList): boolean {
  return status.some(({ status }) => !status)
}

export function useTransferPackStatus(
  packId: string | null | false
): [TransferPackStatus, number] {
  const auth = useAuth()

  const { data } = useAPI<TransferPackStatusList>(
    ['pack_transfer_status', packId],
    urlFor(urls.api.packs.transferById, { packId }),
    {
      enabled: !!(auth.user && packId),
      refetchInterval: (data) => {
        if (!data || isPending(data) || hasNoStatus(data)) {
          return 1000
        }

        return false
      },
    }
  )

  const status = useMemo(() => {
    if (!data) return TransferPackStatus.Idle

    // One or more NFTs are not yet minted
    if (hasNoStatus(data)) return TransferPackStatus.Minting

    // One ore more NFTs are still being transferred
    if (isPending(data)) return TransferPackStatus.Transferring

    // One or more failed
    if (hasError(data)) return TransferPackStatus.Error

    // All succeeded
    if (isConfirmed(data)) return TransferPackStatus.Success

    return TransferPackStatus.Idle
  }, [data])

  const count = data?.status.length ?? 0

  return [status, count]
}
