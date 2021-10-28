import clsx from 'clsx'
import { createElement, ReactNode } from 'react'

export interface HeadingProps {
  children: ReactNode
  inheritColor?: boolean
  className?: string
  level?: number
  size?: number
  bold?: boolean
}

export default function Heading({
  children,
  className,
  inheritColor,
  level = 1,
  bold,
  size,
}: HeadingProps) {
  if (!size) size = level

  return createElement(
    `h${level}`,
    {
      className: clsx(
        {
          'text-base-gray-dark': !inheritColor,
          'font-bold text-2xl': size === 1,
          'text-xl': size === 2,
          'text-lg': size === 3,
          'text-md': size === 4,
          'font-bold': bold,
        },
        className
      ),
    },
    children
  )
}
