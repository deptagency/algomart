import clsx from 'clsx'
import { ReactNode } from 'react'

import css from './grid.module.css'

export type ColumnCount = number
export type GapSize = number | 'px'

export interface GridProps {
  children: ReactNode
  className?: string
  base?: ColumnCount
  sm?: ColumnCount
  md?: ColumnCount
  lg?: ColumnCount
  xl?: ColumnCount
  gapBase?: GapSize
  gapSm?: GapSize
  gapMd?: GapSize
  gapLg?: GapSize
  gapXl?: GapSize
}

const gapUnitToPixels = (gap: GapSize): string =>
  (gap === 'px' ? 1 : gap * 4) + 'px'

export default function Grid({
  children,
  base = 1,
  sm,
  md,
  lg,
  xl,
  gapBase = 4,
  gapSm,
  gapMd,
  gapLg,
  gapXl,
  className,
}: GridProps) {
  sm ??= base
  md ??= sm
  lg ??= md
  xl ??= lg

  gapSm ??= gapBase
  gapMd ??= gapSm
  gapLg ??= gapMd
  gapXl ??= gapLg

  return (
    <div
      style={
        {
          '--colsBase': base,
          '--colsSm': sm,
          '--colsMd': md,
          '--colsLg': lg,
          '--colsXl': xl,
          '--gapBase': gapUnitToPixels(gapBase),
          '--gapSm': gapUnitToPixels(gapSm),
          '--gapMd': gapUnitToPixels(gapMd),
          '--gapLg': gapUnitToPixels(gapLg),
          '--gapXl': gapUnitToPixels(gapXl),
        } as unknown
      }
      className={clsx(css.root, className)}
    >
      {children}
    </div>
  )
}
