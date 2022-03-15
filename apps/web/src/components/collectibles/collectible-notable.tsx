import { CollectibleBase } from '@algomart/schemas'
import Image from 'next/image'

import css from './collectible-notable.module.css'

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
          objectFit="contain"
          src={collectible.image}
          width={250}
          sizes="(min-width: 768px) 25vw, (min-width: 640px) 50vw, 100vw"
        />
      </div>
      <div className={css.content}>
        <div className={css.title}>{collectible.title}</div>
      </div>
    </div>
  )
}
