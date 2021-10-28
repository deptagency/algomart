import clsx from 'clsx'
import { ReactNode } from 'react'

import css from './notification.module.css'

interface TextInputProps {
  className?: string
  content: ReactNode | string
  showBorder?: boolean
  variant?: 'blue' | 'green' | 'red'
}

export default function TextInput({
  className,
  content,
  showBorder = false,
  variant = 'blue',
}: TextInputProps) {
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
