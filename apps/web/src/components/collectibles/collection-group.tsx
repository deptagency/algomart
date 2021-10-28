import { CollectionBase } from '@algomart/schemas'
import Image from 'next/image'

import css from './collection-group.module.css'

import { cmsImageLoader } from '@/utils/cms-image-loader'

export interface CollectionGroupProps {
  collection: CollectionBase
}

export default function CollectionGroup({ collection }: CollectionGroupProps) {
  return (
    <div>
      <div className={css.imageWrapper}>
        <div className={css.image}>
          <Image
            alt={collection.name}
            layout="responsive"
            loader={cmsImageLoader}
            objectFit="cover"
            src={collection.image}
            height={320}
            width={320}
          />
        </div>
      </div>
      <div className={css.textTitle}>{collection.name}</div>
    </div>
  )
}
