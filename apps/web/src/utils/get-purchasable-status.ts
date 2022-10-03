import { CollectibleWithDetails } from '@algomart/schemas'

export enum PurchasableStatus {
  NotListed = 'notListed',
  NoUser = 'noUser',
  IsOwner = 'isOwner',
  CanPurchase = 'canPurchase',
}

export default function getPurchasableStatus(
  collectible: CollectibleWithDetails,
  currentUserAddress?: string
): PurchasableStatus {
  if (collectible.currentOwnerAddress === currentUserAddress)
    return PurchasableStatus.IsOwner
  if (!collectible.price && !collectible.listingType)
    return PurchasableStatus.NotListed
  if (!currentUserAddress) return PurchasableStatus.NoUser
  return PurchasableStatus.CanPurchase
}
