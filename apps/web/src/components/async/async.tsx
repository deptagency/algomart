import clsx from 'clsx'
import { useEffect, useRef } from 'react'

import css from './async.module.css'

import Loading, { LoadingProps } from '@/components/loading/loading'

export interface AsyncProps extends LoadingProps {
  isLoading?: boolean
  children?: React.ReactNode
  preventScroll?: boolean
}

/**
 * A content wrapper that displays a <Loading/> indicator
 * over content when `isLoading` is `true`.
 */
export default function Async({
  children,
  isLoading,
  preventScroll = false,
  ...loadingProps
}: AsyncProps) {
  const reference = useRef<HTMLDivElement>()

  const loader = isLoading ? (
    <Loading ref={reference} bold loadingText="" {...loadingProps} />
  ) : null

  useEffect(() => {
    if (reference.current && !preventScroll) {
      reference.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isLoading, preventScroll])

  return children ? (
    <div
      className={clsx(css.root, {
        [css.isLoading]: isLoading,
      })}
      aria-live="polite"
      aria-busy={isLoading}
    >
      <div className={css.loaderContainer}>{loader}</div>
      <div className={css.childrenContainer}>{children}</div>
    </div>
  ) : (
    loader
  )
}
