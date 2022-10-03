import { CollectibleWithDetails } from '@algomart/schemas'
import { isAfterNow } from '@algomart/shared/utils'

export enum TransferrableStatus {
  CanTransfer = 'canTransfer',
  IsListed = 'isListed',
  TransactedRecently = 'transactedRecently',
  NotOwner = 'notOwner',
  NoUser = 'noUser',
}

export default function getTransferrableStatus(
  collectible: CollectibleWithDetails,
  currentUserAddress?: string
) {
  if (!currentUserAddress) return TransferrableStatus.NoUser
  if (collectible.currentOwnerAddress !== currentUserAddress)
    return TransferrableStatus.NotOwner
  if (collectible.listingId) return TransferrableStatus.IsListed
  if (isAfterNow(new Date(collectible.transferrableAt)))
    return TransferrableStatus.TransactedRecently
  return TransferrableStatus.CanTransfer
}
