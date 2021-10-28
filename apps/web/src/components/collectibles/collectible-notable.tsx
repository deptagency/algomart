import { CollectibleBase } from '@algomart/schemas'
import Image from 'next/image'

import css from './collectible-notable.module.css'

import { cmsImageLoader } from '@/utils/cms-image-loader'

export interface NotableCollectibleProps {
  collectible: CollectibleBase
}

export default function NotableCollectible({
  collectible,
}: NotableCollectibleProps) {
  return (
    <div className={css.root}>
      <div className={css.imageWrapper}>
        <Image
          alt={collectible.title}
          height={250}
          layout="responsive"
          loader={cmsImageLoader}
          objectFit="contain"
          src={collectible.image}
          width={250}
        />
      </div>
      <div className={css.content}>
        <div className={css.title}>{collectible.title}</div>
      </div>
    </div>
  )
}
