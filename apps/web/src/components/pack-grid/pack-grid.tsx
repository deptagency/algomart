import { PackWithCollectibles } from '@algomart/schemas'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/outline'
import clsx from 'clsx'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback } from 'react'

import css from './pack-grid.module.css'

import Button from '@/components/button'
import { H1 } from '@/components/heading'
import Loading from '@/components/loading/loading'
import PackItem from '@/components/pack-grid/pack-item'
import {
  TransferPackStatus,
  useTransferPackStatus,
} from '@/hooks/use-transfer-pack'
import { urls } from '@/utils/urls'

export interface PackGridProps {
  packCards: PackWithCollectibles['collectibles']
  packId: PackWithCollectibles['id']
  packTitle: PackWithCollectibles['title']
  transitionStyle?: 'automatic' | 'interactive'
}

export default function PackGrid({
  packCards,
  packId,
  packTitle,
  transitionStyle = 'automatic',
}: PackGridProps) {
  const router = useRouter()
  const { t } = useTranslation()

  const [status, count] = useTransferPackStatus(packId)

  const isInteractive = transitionStyle === 'interactive'

  const viewCollection = useCallback(() => {
    router.push(urls.myCollectibles)
  }, [router])

  return (
    <>
      <div className={css.packHeader}>
        <div className={css.packSubtitle}>
          {t('release:Open Your New NFTs')}
        </div>
        <H1 center mb={12} size={3} className={css.packTitle}>
          {packTitle}
        </H1>
      </div>
      <ul
        className={clsx(css.gridWrapper, {
          [css.single]: packCards.length === 1,
          [css.double]: packCards.length === 2,
        })}
      >
        {packCards.map((item) => (
          <PackItem
            imageSource={item.image}
            videoSource={item.previewVideo}
            rarity={item.rarity}
            packTitle={packTitle}
            title={`${item.title} #${item.edition}`}
            key={item.id}
            isInteractive={isInteractive}
          />
        ))}
      </ul>
      <div className={css.transferContainer}>
        {status === TransferPackStatus.Idle && (
          <div className={css.loadingWrapper}>
            <Loading loadingText={t('common:statuses.Waiting for status')} />
          </div>
        )}
        {status === TransferPackStatus.Minting && (
          <div className={css.loadingWrapper}>
            <Loading
              loadingText={t('common:statuses.Minting NFT', {
                count,
              })}
            />
          </div>
        )}
        {status === TransferPackStatus.Transferring && (
          <div className={css.loadingWrapper}>
            <Loading
              loadingText={t('common:statuses.Transferring NFT', {
                count,
              })}
              bold
            />
          </div>
        )}

        {status === TransferPackStatus.Error && (
          <div className={css.statusWrapper}>
            <ExclamationCircleIcon className={css.errorIcon} />
            <h3 className={css.statusHeading}>
              {t('common:statuses.An Error has Occurred')}
            </h3>
            <p className={css.statusMessage}>{t('release:failedToTransfer')}</p>
          </div>
        )}

        {status === TransferPackStatus.Success && (
          <div className={css.statusWrapper}>
            <CheckCircleIcon className={css.successIcon} />
            <h3 className={css.statusHeading}>
              {t('common:statuses.Success!')}
            </h3>
            <p className={css.statusMessage}>
              {t('release:successTransferConfirmation', {
                name: packTitle,
              })}
            </p>
            <Button
              data-e2e="transfer-success-button"
              className={css.button}
              onClick={viewCollection}
            >
              {t('common:actions.View In My Collection')}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
