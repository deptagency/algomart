import { RarityBase } from '@algomart/schemas'
import clsx from 'clsx'
import Image from 'next/image'

import css from './featured-rarity.module.css'

import { H2 } from '@/components/heading'

export interface FeaturedRarityProps {
  className?: string
  rarity: RarityBase
}

export function FeaturedRarity({ className, rarity }: FeaturedRarityProps) {
  return (
    <div className={clsx(css.root, className)}>
      {rarity.image && (
        <div className={css.imageWrapper}>
          <Image
            className={css.image}
            alt={rarity.name}
            src={rarity.image}
            width="100%"
            height="100%"
            layout="responsive"
            objectFit="cover"
          />
        </div>
      )}
      <H2 className={css.name} uppercase inheritColor>
        {rarity.name}
      </H2>
      {rarity.description}
    </div>
  )
}
