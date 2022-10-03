import { CollectionBase } from '@algomart/schemas'
import Markdown from 'markdown-to-jsx'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'
import { useEffect, useState } from 'react'

import LinkButton from '../link-button'

import css from './collection-header.module.css'

import { H2 } from '@/components/heading'
import { urls } from '@/utils/urls'

export interface CollectionHeaderProps {
  collection: CollectionBase
  totalCollected: number
  totalCollectibles: number
}

export default function CollectionHeader({
  collection,
  totalCollected,
  totalCollectibles,
}: CollectionHeaderProps) {
  const { t } = useTranslation()
  const [percentCollected, setPercentCollected] = useState(0)

  useEffect(() => {
    // Delay setting this value so we can animate in the progress bar.
    setTimeout(() => {
      setPercentCollected((totalCollected / totalCollectibles) * 100)
    }, 150)
  }, [totalCollected, totalCollectibles])

  const collectionIsComplete = totalCollected === totalCollectibles

  return (
    <div className={css.root}>
      <div className={css.collectionImage}>
        <Image
          alt={collection.name}
          height={300}
          objectFit="cover"
          layout="responsive"
          src={collection.image}
          width={300}
        />
      </div>

      <div>
        {collection.reward?.image && (
          <Image
            alt={collection.name}
            className={css.rewardImage}
            height={50}
            objectFit="cover"
            layout="intrinsic"
            src={collection.reward.image}
            width={50}
          />
        )}

        <H2 uppercase mt={2} mb={1}>
          {collection.name}
        </H2>

        {collection.description && (
          <div className={css.content}>
            <Markdown options={{ forceBlock: true }}>
              {collection.description}
            </Markdown>
          </div>
        )}

        {!collectionIsComplete && collection.reward?.prompt && (
          <div className={css.content}>
            <Markdown options={{ forceBlock: true }}>
              {collection.reward?.prompt}
            </Markdown>
          </div>
        )}

        {collectionIsComplete && collection.reward?.complete && (
          <div className={css.content}>
            <Markdown options={{ forceBlock: true }}>
              {collection.reward?.complete}
            </Markdown>
          </div>
        )}

        <div className={css.totalCollected}>
          <strong>{t('common:statuses.Collected')}</strong>
          <strong>
            {t('collection:collectionPage.Number of Total', {
              number: totalCollected,
              total: totalCollectibles,
            })}
          </strong>
        </div>

        <div className={css.progressOuter}>
          <div
            className={css.progressInner}
            style={{ width: `${percentCollected}%` }}
          />
        </div>

        {!collectionIsComplete && (
          <LinkButton className={css.button} href={urls.drops}>
            {t('common:actions.Buy Packs', {
              collectionName: collection.name,
            })}
          </LinkButton>
        )}
      </div>
    </div>
  )
}
