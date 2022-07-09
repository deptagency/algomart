import { CollectibleWithDetails } from '@algomart/schemas'
import { isAfterNow } from '@algomart/shared/utils'

export enum TransferrableStatus {
  CanTransfer = 'canTransfer',
  Frozen = 'frozen',
  MintedRecently = 'mintedRecently',
  NoUser = 'noUser',
  NotOwner = 'notOwner',
}

export function getTransferrableStatus(
  collectible: CollectibleWithDetails,
  currentUserAddress?: string
): TransferrableStatus {
  if (!currentUserAddress) return TransferrableStatus.NoUser
  if (collectible.currentOwnerAddress !== currentUserAddress)
    return TransferrableStatus.NotOwner
  if (isAfterNow(new Date(collectible.transferrableAt)))
    return TransferrableStatus.MintedRecently
  return TransferrableStatus.CanTransfer
}
