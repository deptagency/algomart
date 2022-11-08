import clsx from 'clsx'
import { createElement, ReactNode } from 'react'

// These must be safelisted in tailwind.config due to classname interpolation
type MarginSize = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16

export interface HeadingProps {
  bold?: boolean
  center?: boolean
  children: ReactNode
  className?: string
  inheritColor?: boolean
  level?: 1 | 2 | 3 | 4
  mb?: MarginSize
  mt?: MarginSize
  my?: MarginSize
  size?: 1 | 2 | 3 | 4
  uppercase?: boolean
}

function Heading({
  bold,
  center,
  children,
  className,
  inheritColor,
  level = 1,
  mb,
  mt,
  my,
  size,
  uppercase,
}: HeadingProps) {
  if (!size) size = level

  return createElement(
    `h${level}`,
    {
      className: clsx(
        'leading-tight',
        {
          'font-bold': bold,
          'font-semibold': !bold,
          'text-base-textPrimary': !inheritColor,
          'text-2xl': size === 1,
          'text-xl': size === 2,
          'text-lg': size === 3,
          'text-base': size === 4,
          'text-center': center,
          uppercase: uppercase,
          [`mb-${mb}`]: !!mb,
          [`mt-${mt}`]: !!mt,
          [`my-${my}`]: !!my,
        },
        className
      ),
    },
    children
  )
}

export function H1(props: HeadingProps) {
  return <Heading level={1} {...props} />
}

export function H2(props: HeadingProps) {
  return <Heading level={2} {...props} />
}

export function H3(props: HeadingProps) {
  return <Heading level={3} {...props} />
}

export function H4(props: HeadingProps) {
  return <Heading level={4} {...props} />
}
