import clsx from 'clsx'
import Image from 'next/image'

import css from './logo.module.css'

import AppLink from '@/components/app-link/app-link'

// Images
const ImageBlack = '/images/logos/algorand_logo_mark_black.svg'
const ImageGrey = '/images/logos/algorand_logo_mark_grey.svg'
const ImageWhite = '/images/logos/algorand_logo_mark_white.svg'

export interface LogoProps {
  className?: string
  linkClassName?: string
  isLinked?: boolean
  color?: 'white' | 'black' | 'grey'
  layout?: 'fixed' | 'intrinsic' | 'responsive'
}

export default function Logo({
  className,
  linkClassName,
  isLinked = true,
  color = 'grey',
  layout = 'responsive',
}: LogoProps) {
  const props = { alt: 'Algorand Storefront', layout, className }
  const image =
    color === 'grey' ? (
      <Image src={ImageGrey} {...props} width={24} height={24} />
    ) : color === 'white' ? (
      <Image src={ImageWhite} {...props} width={24} height={24} />
    ) : (
      <Image src={ImageBlack} {...props} width={24} height={24} />
    )
  return !isLinked ? (
    image
  ) : (
    <AppLink className={clsx(css.link, linkClassName)} href="/">
      {image}
    </AppLink>
  )
}
