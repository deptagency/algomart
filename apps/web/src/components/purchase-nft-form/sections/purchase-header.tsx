import { PublishedPack } from '@algomart/schemas'
import Image from 'next/image'

import css from './purchase-header.module.css'

import Heading from '@/components/heading'

export interface PurchaseHeaderProps {
  release: PublishedPack
}

export default function PurchaseHeader({ release }: PurchaseHeaderProps) {
  const size = 110
  const imageURL = `${release.image}?fit=cover&height=${size}&width=${size}&quality=75`
  return (
    <>
      <header>
        <div className={css.imageWrapper}>
          <Image
            alt={release.title}
            className={css.image}
            layout="intrinsic"
            src={imageURL}
            height={size}
            width={size}
          />
        </div>
      </header>
      <Heading level={2} className={css.title}>
        {release.title}
      </Heading>
    </>
  )
}
