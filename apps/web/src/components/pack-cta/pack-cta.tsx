import { PackStatus, PackType, PublishedPack } from '@algomart/schemas'
import { isBeforeNow } from '@algomart/shared/utils'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import css from './pack-cta.module.css'

import Button from '@/components/button/button'
import Counter from '@/components/counter/counter'
import LinkButton from '@/components/link-button'
import ClaimNFTModal from '@/components/modals/claim-nft-modal'
import { useAuth } from '@/contexts/auth-context'
import { useRedemption } from '@/contexts/redemption-context'
import { CollectibleService } from '@/services/collectible-service'
import { urlFor, urls } from '@/utils/urls'

export function PackCta({
  enableButtonFunctionality,
  pack,
}: {
  enableButtonFunctionality: boolean
  pack: PublishedPack
}) {
  const { isAuthenticated } = useAuth()
  const { t } = useTranslation()
  const { asPath } = useRouter()
  const { setRedeemable } = useRedemption()
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  const hasReleased = pack.releasedAt && isBeforeNow(new Date(pack.releasedAt))

  const handleToggleClaimNFTModal = useCallback(() => {
    setIsModalOpen(!isModalOpen)
  }, [isModalOpen])

  const handleClaimNFT = useCallback(
    async (redeemCode: string): Promise<{ packId: string } | string> => {
      // Redeem/claim asset
      const { packId } =
        pack.type === PackType.Redeem
          ? await CollectibleService.instance.redeem(redeemCode)
          : await CollectibleService.instance.claim(pack.templateId)

      // Don't mint if redemption fails
      if (!packId) {
        return t('forms:errors.invalidRedemptionCode')
      }

      // Clear redemption data
      if (pack.type === PackType.Redeem) {
        setRedeemable(null)
      }

      return { packId }
    },
    [pack.templateId, pack.type, setRedeemable, t]
  )

  // if button functionality enabled and user is unauthenticated, show sign up cta
  if (enableButtonFunctionality && !isAuthenticated) {
    return (
      <LinkButton href={urlFor(urls.signUp, null, { redirect: asPath })}>
        {t('release:joinNowToStartCollecting')}
      </LinkButton>
    )
  }

  return pack.available ? (
    <div className={css.ctaButton}>
      {(pack.type === PackType.Free || pack.type === PackType.Redeem) && (
        <Button
          data-e2e="claim-button"
          fullWidth
          onClick={
            enableButtonFunctionality ? handleToggleClaimNFTModal : undefined
          }
        >
          {t('common:actions.Claim My Edition')}
        </Button>
      )}

      {pack.type === PackType.Purchase &&
        (hasReleased ? (
          enableButtonFunctionality ? (
            <LinkButton
              variant="primary"
              fullWidth
              href={urlFor(urls.checkoutPack, { packSlug: pack.slug })}
            >
              {t('common:actions.Buy Now')}
            </LinkButton>
          ) : (
            <Button fullWidth>{t('common:actions.Buy Now')}</Button>
          )
        ) : (
          <div className={css.releaseCounter}>
            <Counter
              plainString
              includeDaysInPlainString
              target={new Date(pack.releasedAt as string)}
            />
          </div>
        ))}

      {pack.type === PackType.Auction && (
        <Button fullWidth disabled={enableButtonFunctionality}>
          {enableButtonFunctionality ? (
            t('release:notYetSupported')
          ) : (
            <>
              {pack.status === PackStatus.Active &&
                t('common:actions.Place Bid')}
              {pack.status === PackStatus.Expired && (
                <>
                  {t('release:Auction Has')} {t('release:Ended')}
                </>
              )}
              {pack.status === PackStatus.Upcoming &&
                t('release:Starting Soon')}
            </>
          )}
        </Button>
      )}

      <ClaimNFTModal
        onClose={handleToggleClaimNFTModal}
        open={isModalOpen}
        onSubmit={handleClaimNFT}
        packTemplate={pack}
      />
    </div>
  ) : (
    <Button fullWidth disabled>
      {t('common:statuses.Sold Out')}
    </Button>
  )
}
