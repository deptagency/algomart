import { CollectionReward as CollectionRewardType } from '@algomart/schemas'
import Markdown from 'markdown-to-jsx'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'

import css from './collection-reward.module.css'

import Button from '@/components/button'
import { cmsImageLoader } from '@/utils/cms-image-loader'

export interface CollectionRewardProps {
  collectionName: string
  handleRedirectBrand: () => void
  totalCollected: number
  totalCollectibles: number
  reward: CollectionRewardType
}

export default function CollectionReward({
  collectionName,
  handleRedirectBrand,
  totalCollected,
  totalCollectibles,
  reward,
}: CollectionRewardProps) {
  const { t } = useTranslation()

  const percentComplete = (totalCollected / totalCollectibles) * 100
  const collectionIsComplete = percentComplete === 100

  return (
    <section className={css.root}>
      {reward.image && (
        <Image
          alt={collectionName}
          height={300}
          layout="responsive"
          loader={cmsImageLoader}
          objectFit="cover"
          src={reward.image}
          width={700}
        />
      )}

      <div className={css.contentWrapper}>
        <p>
          <strong>
            {t('collection:collectionPage.Number of Total Collected', {
              number: totalCollected,
              total: totalCollectibles,
            })}
          </strong>
        </p>

        <div className={css.progressOuter}>
          <div
            className={css.progressInner}
            style={{ width: `${percentComplete}%` }}
          />
        </div>

        {!collectionIsComplete && (
          <>
            {reward.prompt && (
              <Markdown options={{ forceBlock: true }}>
                {reward.prompt}
              </Markdown>
            )}
            <Button className={css.button} onClick={handleRedirectBrand}>
              {/* @TODO: Change to Buy Collection Packs when filtering by collection/set */}
              {t('common:actions.Buy Packs to Add to Collection', {
                collectionName,
              })}
            </Button>
          </>
        )}

        {collectionIsComplete && reward.complete && (
          <Markdown options={{ forceBlock: true }}>{reward.complete}</Markdown>
        )}
      </div>
    </section>
  )
}
