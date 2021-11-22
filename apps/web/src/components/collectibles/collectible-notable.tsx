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
    <div className="relative flex flex-col h-full overflow-hidden text-center rounded-md shadow-large">
      <div className={css.imageWrapper}>
        <div className={` w-full relative h-80`}>
          <Image
            alt={collectible.title}
            layout="fill"
            className="rounded-xl transition-all hover:opacity-80 object-contain lg:object-cover w-full h-full"
            loader={cmsImageLoader}
            objectFit="contain"
            src={collectible.image}
          />
        </div>
      </div>
      <div className={css.content}>
        <div className={css.title}>{collectible.title}</div>
      </div>
    </div>
  )
}
