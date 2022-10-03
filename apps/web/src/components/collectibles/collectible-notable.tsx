import { CollectibleBase } from '@algomart/schemas'
import Image from 'next/image'

import css from './collectible-notable.module.css'

import AppLink from '@/components/app-link/app-link'
import { ReactComponent as Play } from '@/svgs/play.svg'
import { urlFor, urls } from '@/utils/urls'

export interface NotableCollectibleProps {
  collectible: CollectibleBase
}

export default function NotableCollectible({
  collectible,
}: NotableCollectibleProps) {
  return (
    <AppLink
      href={urlFor(urls.marketplaceListing, {
        uniqueCode: collectible.uniqueCode,
      })}
      className={css.root}
    >
      <div className={css.imageWrapper}>
        {collectible.previewVideo ? (
          <div className={css.playIconWrapper}>
            <Play className={css.playIcon} />
          </div>
        ) : null}
        <Image
          alt={collectible.title}
          height={250}
          layout="responsive"
          objectFit="contain"
          src={collectible.image}
          width={250}
          sizes="(min-width: 768px) 25vw, (min-width: 640px) 50vw, 100vw"
        />
      </div>
      <div className={css.content}>
        <div className={css.title}>{collectible.title}</div>
      </div>
    </AppLink>
  )
}
