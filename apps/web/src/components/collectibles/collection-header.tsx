import { CollectionBase } from '@algomart/schemas'
import Markdown from 'markdown-to-jsx'
import Image from 'next/image'

import css from './collection-header.module.css'

import Heading from '@/components/heading'
import { cmsImageLoader } from '@/utils/cms-image-loader'

export interface CollectionHeaderProps {
  collection: CollectionBase
}

export default function CollectionHeader({
  collection,
}: CollectionHeaderProps) {
  return (
    <div className={css.root}>
      <Heading className={css.heading}>{collection.name}</Heading>

      <div className={css.imageContainer}>
        <Image
          alt={collection.name}
          height={240}
          layout="responsive"
          loader={cmsImageLoader}
          objectFit="cover"
          src={collection.image}
          width={240}
        />
      </div>

      {collection.description && (
        <div className={css.description}>
          <Markdown options={{ forceBlock: true }}>
            {collection.description}
          </Markdown>
        </div>
      )}
    </div>
  )
}
