import { ExclamationCircleIcon } from '@heroicons/react/outline'
import clsx from 'clsx'

import css from './success-failure.module.css'

import Button from '@/components/button'
import Heading from '@/components/heading'

export interface FailureProps {
  buttonText?: string
  error: string
  handleClick: () => void
  headingClassName?: string
  headingText: string
  iconClassName?: string
}

export default function Failure({
  buttonText,
  error,
  handleClick,
  headingClassName,
  headingText,
  iconClassName,
}: FailureProps) {
  return (
    <div className={css.failureRoot}>
      <ExclamationCircleIcon
        className={clsx(css.icon, iconClassName, css.errorIcon)}
        height="48"
        width="48"
      />
      <Heading className={clsx(css.heading, headingClassName)} level={3}>
        {headingText}
      </Heading>
      {error && <p className={css.errorHeading}>{error}</p>}
      <Button
        className={clsx(css.button, css.errorButton)}
        onClick={handleClick}
        size="small"
      >
        {buttonText}
      </Button>
    </div>
  )
}
