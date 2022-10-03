import { CollectibleWithDetails } from '@algomart/schemas'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'

import css from './collection-item.module.css'

import AppLink from '@/components/app-link/app-link'
import Pill from '@/components/pill'

export interface CollectionItemProps {
  collectible?: CollectibleWithDetails
  href?: string
  onClick?: () => void
}

export default function CollectionItem({
  collectible,
  href,
  onClick,
}: CollectionItemProps) {
  const { t } = useTranslation()

  if (!collectible) {
    return (
      <div className={css.root}>
        <div className={css.unrevealed}>
          <Image
            src="/images/textures/nft-placeholder.png"
            alt={t('common:statuses.Uncollected')}
            width="100%"
            height="100%"
            objectFit="cover"
            layout="responsive"
          />
        </div>
      </div>
    )
  }
  const ImageWrapperTag =
    typeof href === 'string'
      ? AppLink
      : typeof onClick === 'function'
      ? 'button'
      : 'div'

  return (
    <div className={css.root}>
      <ImageWrapperTag
        onClick={onClick}
        href={href}
        className={css.imageWrapper}
      >
        <Image
          src={collectible.image}
          alt={collectible.title}
          width={160}
          height={160}
          objectFit="cover"
          layout="responsive"
        />
      </ImageWrapperTag>

      <h4 className={css.title} title={collectible.title}>
        <div>{collectible.title}</div>
      </h4>
      <div className={css.pills}>
        {collectible.rarity && (
          <Pill color={collectible.rarity?.color}>
            {collectible.rarity?.name}
          </Pill>
        )}
      </div>
    </div>
  )
}
