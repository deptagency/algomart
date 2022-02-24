import { CheckCircleIcon } from '@heroicons/react/outline'
import clsx from 'clsx'

import css from './success-failure.module.css'

import Button from '@/components/button'
import Heading from '@/components/heading'

export interface SuccessPros {
  buttonText?: string
  handleClick: () => void
  headingClassName?: string
  headingText: string
  notice?: string
}

export default function Success({
  buttonText,
  handleClick,
  headingClassName,
  headingText,
  notice,
}: SuccessPros) {
  return (
    <div className={css.successRoot}>
      <CheckCircleIcon
        className={clsx(css.icon, css.successIcon)}
        height="48"
        width="48"
      />
      <Heading className={clsx(css.heading, headingClassName)} level={3}>
        {headingText}
      </Heading>
      {notice && (
        <div className={css.noticeWrapper}>
          <p className={css.notice}>{notice}</p>
        </div>
      )}
      <Button className={css.button} onClick={handleClick}>
        {buttonText}
      </Button>
    </div>
  )
}
