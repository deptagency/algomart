import clsx from 'clsx'
import Image from 'next/image'

import css from './logo.module.css'

import AppLink from '@/components/app-link/app-link'

// Images
const ImageBlack = '/images/logos/og2d-logo.png'
const ImageGrey = '/images/logos/og2d-logo.png'
const ImageWhite = '/images/logos/og2d-logo.png'

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
  const props = { alt: 'AlgoMart', layout, className }
  const image =
    color === 'grey' ? (
      <Image src={ImageGrey} {...props} objectFit="cover" layout="fill" />
    ) : color === 'white' ? (
      <Image src={ImageWhite} {...props} objectFit="cover" layout="fill" />
    ) : (
      <Image src={ImageBlack} {...props} objectFit="cover" layout="fill" />
    )
  return !isLinked ? (
    image
  ) : (
    <AppLink className={clsx(css.link, linkClassName)} href="/">
      <div className="h-8 w-32 relative">{image}</div>
    </AppLink>
  )
}
