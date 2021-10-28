import { PhotographIcon } from '@heroicons/react/outline'
import clsx from 'clsx'

import css from './collectible-placeholder.module.css'

export interface CollectiblePlaceholderProps {
  className?: string
  label?: string | number
  noBorder?: boolean
}

export default function CollectiblePlaceholder({
  className,
  label,
  noBorder,
}: CollectiblePlaceholderProps) {
  return (
    <div className={clsx(className, css.root)}>
      <div className={clsx(css.iconWrapper, { [css.noBorder]: noBorder })}>
        {label ? (
          <div className={css.labelWrapper}>
            <span className={css.label}>{label}</span>
          </div>
        ) : (
          <PhotographIcon className={css.icon} />
        )}
      </div>
    </div>
  )
}
