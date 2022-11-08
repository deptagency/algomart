import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'
import { ReactNode } from 'react'

import css from './pill.module.css'

export interface PillProps {
  children: ReactNode
  className?: string
  color?: string
  small?: boolean
  onRemove?: () => void
}

export default function Pill({
  children,
  className,
  color,
  small,
  onRemove,
}: PillProps) {
  const { t } = useTranslation()
  return (
    <div
      className={clsx(
        css.pill,
        {
          [css.small]: small,
          [css.removable]: !!onRemove,
        },
        className
      )}
      style={{
        backgroundColor: color,
        color: 'white',
      }}
    >
      {children}
      {onRemove && (
        <button
          className={css.remove}
          onClick={onRemove}
          onKeyDown={(event) => {
            if (event.code === 'Backspace') onRemove()
          }}
          aria-label={t('common:actions.Remove')}
        >
          <span className={css.removeIcon}>&times;</span>
        </button>
      )}
    </div>
  )
}
