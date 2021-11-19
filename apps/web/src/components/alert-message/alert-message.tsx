import clsx from 'clsx'
import { ReactNode } from 'react'

import css from './alert-message.module.css'

interface AlertMessage {
  className?: string
  content: ReactNode | string
  showBorder?: boolean
  variant?: 'blue' | 'green' | 'red'
}

export default function AlertMessage({
  className,
  content,
  showBorder = false,
  variant = 'blue',
}: AlertMessage) {
  return (
    <section
      className={clsx(
        {
          [css.containerBlue]: variant === 'blue',
          [css.containerGreen]: variant === 'green',
          [css.containerRed]: variant === 'red',
          [css.blueBorder]: variant === 'blue' && showBorder,
          [css.greenBorder]: variant === 'green' && showBorder,
          [css.redBorder]: variant === 'red' && showBorder,
        },
        className
      )}
    >
      <div
        className={clsx({
          [css.contentBlue]: variant === 'blue',
          [css.contentGreen]: variant === 'green',
          [css.contentRed]: variant === 'red',
        })}
      >
        {content}
      </div>
    </section>
  )
}
