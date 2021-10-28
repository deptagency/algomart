import { CollectibleWithDetails } from '@algomart/schemas'
import {
  CheckCircleIcon,
  PlusCircleIcon,
  XCircleIcon,
} from '@heroicons/react/solid'
import clsx from 'clsx'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'

import css from './collectible-item.module.css'

import { cmsImageLoader } from '@/utils/cms-image-loader'

export interface CollectibleItemProps {
  alt?: string
  cardView?: boolean
  imageUrl?: string
  isNew?: boolean
  mode?: 'add' | 'remove' | 'selected'
  onClick?: () => void
  questionMarkSize?: 'small' | 'medium' | 'large'
  rarity?: Partial<CollectibleWithDetails['rarity']> | null
  setNumber?: number
  title?: string
  uncollected?: boolean
}

export default function CollectibleItem({
  alt,
  cardView = false,
  imageUrl,
  isNew = false,
  mode,
  onClick,
  questionMarkSize = 'medium',
  rarity,
  setNumber,
  title,
  uncollected = false,
}: CollectibleItemProps) {
  const { t } = useTranslation()

  const hasMetadata = rarity || setNumber
  const showImage = imageUrl && alt && !uncollected

  const img = showImage ? (
    <Image
      loader={cmsImageLoader}
      src={imageUrl}
      alt={alt}
      width={160}
      height={160}
      objectFit="contain"
      layout="responsive"
    />
  ) : (
    <div className={css.questionMarkWrapper}>
      <div
        className={clsx(css.questionMark, {
          [css.questionMarkSmall]: questionMarkSize === 'small',
          [css.questionMarkMedium]: questionMarkSize === 'medium',
          [css.questionMarkLarge]: questionMarkSize === 'large',
        })}
      >
        ?
      </div>
    </div>
  )

  return (
    <div
      className={clsx(css.root, { [css.rootCard]: cardView || hasMetadata })}
    >
      {mode === 'remove' || !onClick ? (
        <>
          <div className={css.imageWrapper}>{img}</div>
          {mode === 'remove' && onClick && (
            <div>
              <button onClick={onClick} className={css.removeButton}>
                <XCircleIcon className={css.removeIcon} />
              </button>
            </div>
          )}
        </>
      ) : (
        <button onClick={onClick} className={css.imageWrapper}>
          {img}
          {(mode === 'add' || mode === 'selected') && (
            <div className={css.overlay}>
              {mode === 'add' ? (
                <PlusCircleIcon className={css.addIcon} />
              ) : (
                <CheckCircleIcon className={css.checkIcon} />
              )}
            </div>
          )}
          {isNew && <div className={css.badge}>{t('common:statuses.New')}</div>}
        </button>
      )}

      {title && (
        <div className={clsx(css.title, { [css.titleFaded]: uncollected })}>
          {title}
        </div>
      )}

      {hasMetadata && (
        <div
          className={clsx(css.metaWrapper, {
            [css.metaCenter]: !setNumber,
          })}
        >
          {setNumber && <div className={css.setNumber}>#{setNumber}</div>}
          {rarity && (
            <div
              className={css.rarity}
              style={
                rarity?.color ? { backgroundColor: rarity.color } : undefined
              }
            >
              {rarity?.name}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
