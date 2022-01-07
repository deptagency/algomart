import { PublishedPack } from '@algomart/schemas'
import Image from 'next/image'

import css from './crypto-header.module.css'

import Heading from '@/components/heading'

export interface CryptoFormHeaderProps {
  release?: PublishedPack
}

export default function CryptoFormHeader({ release }: CryptoFormHeaderProps) {
  const size = 110
  const imageURL = `${release?.image}?fit=cover&height=124&width=100&quality=75`
  return (
    <>
      <header>
        <div className={css.imageWrapper}>
          <Image
            alt={release?.title}
            className={css.image}
            layout="intrinsic"
            src={imageURL}
            height={size}
            width={size}
          />
        </div>
      </header>
      <Heading level={2} className={css.title}>
        {release?.title}
      </Heading>
    </>
  )
}
