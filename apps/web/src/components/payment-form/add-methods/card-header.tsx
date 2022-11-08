import Image from 'next/image'

import css from './card-header.module.css'

import { H2, H4 } from '@/components/heading'

export interface CardPurchaseHeaderProps {
  image?: string
  title?: string
  subtitle?: string
}

export default function CardPurchaseHeader({
  image,
  title,
  subtitle,
}: CardPurchaseHeaderProps) {
  const size = 110
  const imageURL = `${image}?fit=cover&height=${size}&width=${size}&quality=75`
  return (
    <>
      <header>
        <div className={css.imageWrapper}>
          <Image
            alt={title}
            className={css.image}
            layout="intrinsic"
            src={imageURL}
            height={size}
            width={size}
          />
        </div>
      </header>
      <H2 mb={subtitle ? 0 : 12}>{title}</H2>
      {subtitle ? <H4 mb={12}>{subtitle}</H4> : null}
    </>
  )
}
