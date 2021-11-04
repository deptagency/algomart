import {
  PackAuction,
  PackStatus,
  PackType,
  PublishedPack,
} from '@algomart/schemas'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useState } from 'react'

import css from './release-template.module.css'

import Alert from '@/components/alert/alert'
import MediaGallery from '@/components/media-gallery/media-gallery'
import ClaimNFTModal from '@/components/modals/claim-nft-modal'
import Notification from '@/components/notification/notification'
import ReleaseDetails from '@/components/release-details/release-details'
import { useAuth } from '@/contexts/auth-context'
import { isAfterNow } from '@/utils/date-time'

export interface ReleaseTemplateProps {
  avatars: { [key: string]: string | null }
  disallowBuyOrClaim: boolean | null
  handleClaimNFT: (
    passphrase: string,
    redeemCode: string
  ) => Promise<{ packId: string } | string>
  isHighestBidder: boolean | null
  isOutbid: boolean | null
  isOwner: boolean | null
  isWinningBidder: boolean | null
  packAuction: PackAuction | null
  packTemplate: PublishedPack
}

export default function ReleaseTemplate({
  avatars,
  disallowBuyOrClaim,
  handleClaimNFT,
  isHighestBidder,
  isOutbid,
  isOwner,
  isWinningBidder,
  packAuction,
  packTemplate,
}: ReleaseTemplateProps) {
  const { user } = useAuth()
  const { push } = useRouter()
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  const startDateTime = packTemplate.releasedAt
  const endDateTime = packTemplate.auctionUntil
  const packType = packTemplate.type

  const isEnded = endDateTime && !isAfterNow(new Date(endDateTime))
  const isActive =
    packTemplate.status === PackStatus.Active &&
    startDateTime &&
    !isAfterNow(new Date(startDateTime)) &&
    !isEnded
  const isInFuture = startDateTime && isAfterNow(new Date(startDateTime))
  const isAlertDisplayed =
    user &&
    ((packType === PackType.Purchase && isActive) ||
      (packType === PackType.Auction && !isOwner))

  const handleClaimNFTFlow = () => {
    packType === PackType.Purchase || packType === PackType.Auction
      ? push(`/checkout?pack=${packTemplate.slug}`)
      : setIsModalOpen(!isModalOpen)
  }

  const getAlertText = () => {
    if (
      packType === PackType.Purchase &&
      !disallowBuyOrClaim &&
      Boolean(packTemplate.available)
    ) {
      return `${t('release:This release is open')}! ${t(
        'release:N of N editions remaining',
        {
          available: packTemplate.available,
          total: packTemplate.total,
        }
      )}`
    }
    if (packType === PackType.Auction) {
      if (isWinningBidder && isEnded) {
        return `🏆 ${t('release:You won the auction')}! ${t(
          'release:Claim your NFT now'
        )}:`
      } else if (isEnded) {
        return `🎬 ${t('release:This auction has ended')}.`
      }
      if (
        packTemplate.status === PackStatus.Active &&
        isActive &&
        endDateTime
      ) {
        return `🚨 ${t('release:This auction is live')}:`
      }
      if (isInFuture && !isEnded) {
        return `⏰ ${t('release:Auction begins in')}`
      }
    }
    return null
  }

  const getNotificationDetails = (): {
    content: string
    color: 'red' | 'blue' | 'green'
  } | null => {
    if (isWinningBidder) {
      return { content: `${t('release:You won the auction')}!`, color: 'green' }
    } else if (isHighestBidder) {
      return { content: t('release:highBidder'), color: 'green' }
    } else if (isOutbid) {
      return { content: t('release:You were outbid'), color: 'red' }
    }
    return null
  }

  const alertText = getAlertText()
  const notificationDetails = getNotificationDetails()
  return (
    <article className={css.root}>
      {notificationDetails && (
        <Notification
          className={css.notification}
          content={notificationDetails.content}
          showBorder
          variant={notificationDetails.color}
        />
      )}
      <div className={css.content}>
        {isAlertDisplayed && alertText && (
          <Alert
            callToAction={
              packType === PackType.Auction && isActive
                ? t('common:actions.Place Bid')
                : packType === PackType.Auction && isWinningBidder
                ? t('common:actions.Claim NFT')
                : packType === PackType.Purchase && isActive
                ? t('common:actions.Purchase')
                : null
            }
            centerContent={packType === PackType.Purchase ? true : false}
            className={isWinningBidder ? css.alert : undefined}
            content={alertText}
            counterEndTime={
              isActive
                ? endDateTime
                : isInFuture && !isEnded
                ? startDateTime
                : null
            }
            counterText={isActive ? t('release:Ending In') : null}
            handleClick={handleClaimNFTFlow}
          />
        )}

        {/* Media Gallery */}
        <MediaGallery media={[packTemplate.image]} />

        {/* Release Details */}
        <section>
          <ReleaseDetails
            avatars={avatars}
            disallowBuyOrClaim={disallowBuyOrClaim}
            isOwner={isOwner}
            isWinningBidder={isWinningBidder}
            onCheckout={handleClaimNFTFlow}
            packAuction={packAuction}
            packTemplate={packTemplate}
          />
        </section>
      </div>

      {/* Modal */}
      <ClaimNFTModal
        onClose={handleClaimNFTFlow}
        open={isModalOpen}
        onSubmit={handleClaimNFT}
        packTemplate={packTemplate}
      />
    </article>
  )
}
