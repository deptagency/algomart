import Image from 'next/image'

import css from './card-header.module.css'

import Heading from '@/components/heading'

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
      <Heading level={2} className={css.title}>
        {title}
      </Heading>
      {subtitle ? (
        <Heading level={4} className={css.subtitle}>
          {subtitle}
        </Heading>
      ) : null}
    </>
  )
}
