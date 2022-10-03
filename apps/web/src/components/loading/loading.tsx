import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'
import { forwardRef } from 'react'

import css from './loading.module.css'

export interface LoadingProps {
  bold?: boolean
  className?: string
  loadingText?: string
}

export default forwardRef<HTMLDivElement, LoadingProps>(function Loading(
  { bold, className, loadingText }: LoadingProps,
  reference
) {
  const { t } = useTranslation()
  const label = loadingText ?? t('common:statuses.Loading')
  return (
    <div
      className={clsx(css.root, className)}
      role="status"
      aria-busy="true"
      aria-label={loadingText || t('common:statuses.Loading')}
      aria-live="polite"
      ref={reference}
    >
      <span className={css.loadingWrapper}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="101"
          height="101"
          viewBox="0 0 101 101"
          fill="none"
          className={css.svg}
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M27.0511 94.0607C51.3798 107.124 81.6923 97.9924 94.7561 73.6637C107.82 49.335 98.6877 19.0225 74.359 5.95875C50.0303 -7.10497 19.7178 2.02709 6.65406 26.3558C-6.40966 50.6845 2.7224 80.997 27.0511 94.0607ZM31.7819 85.2505C51.2448 95.7015 75.4949 88.3959 85.9459 68.9329C96.3968 49.47 89.0912 25.2199 69.6282 14.769C50.1653 4.31797 25.9152 11.6236 15.4643 31.0866C5.01328 50.5495 12.3189 74.7996 31.7819 85.2505Z"
            fill="#DADCDF"
          />
          <path
            d="M90.3513 72.3396C92.7842 73.6459 95.8416 72.7395 96.9016 70.1896C106.016 48.2649 98.3501 22.8206 78.6418 9.57898C76.3497 8.03895 73.3004 8.97223 71.994 11.4051C70.6876 13.838 71.6262 16.8456 73.8791 18.4425C88.7612 28.9905 94.6142 48.4185 88.0353 65.432C87.0394 68.0076 87.9184 71.0332 90.3513 72.3396Z"
            fill="currentcolor"
          />
        </svg>
      </span>
      {label ? (
        <p
          className={clsx(css.loadingText, {
            'font-bold': bold,
          })}
        >
          {label}
        </p>
      ) : null}
    </div>
  )
})
