import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'

import css from './loading.module.css'

export interface LoadingProps {
  loadingText?: string
  variant?: 'primary' | 'secondary'
}

export default function Loading({
  loadingText,
  variant = 'primary',
}: LoadingProps) {
  const { t } = useTranslation()
  return (
    <div className={css.root}>
      <span className={clsx('animate-spin', css.loadingWrapper)}>
        <svg className={clsx(css.svg, 'animate-pulse')} viewBox="-3 -3 46 46">
          <path
            className={css.svgCorner}
            d="M20,0 a20,20 0 0,1 20,20"
            fill="none"
            strokeWidth="5"
          />
          <path
            className={css.svgCircle}
            d="M20,0 a20,20 0 1,0 20,20"
            fill="none"
            strokeWidth="5"
          />
        </svg>
      </span>
      <p
        className={clsx(css.loadingText, {
          [css.primaryLoadingText]: variant === 'primary',
          [css.secondaryLoadingText]: variant === 'secondary',
        })}
      >
        {loadingText || t('common:statuses.Loading')}
      </p>
    </div>
  )
}
