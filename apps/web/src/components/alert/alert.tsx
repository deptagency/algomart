import clsx from 'clsx'
import { DetailedHTMLProps, HTMLAttributes } from 'react'

import css from './alert.module.css'

import Button from '@/components/button'
import Counter from '@/components/counter/counter'

export interface AlertProps {
  callToAction?: string | null
  centerContent?: boolean
  content: string
  counterEndTime?: string | null
  counterText?: string | null
  handleClick: () => void
  id?: string
}

export default function Alert({
  callToAction,
  className,
  centerContent = false,
  content,
  counterEndTime,
  counterText,
  handleClick,
  id,
  ...props
}: AlertProps &
  DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {
  return (
    <div
      className={clsx(css.alertWrapper, css.flexCenter, className)}
      id={id}
      role="alert"
      {...props}
    >
      <div
        className={clsx(css.contentWrapper, css.fullWidth, {
          [css.centerContent]: centerContent,
        })}
      >
        {content && (
          <p
            className={clsx(css.content, {
              [css.bold]: counterEndTime && counterText,
            })}
          >
            {content}
          </p>
        )}
        {counterEndTime && (
          <>
            {counterText && <span className={css.endDate}>{counterText}</span>}
            <Counter plainString target={new Date(counterEndTime)} />
          </>
        )}
      </div>
      {callToAction && (
        <Button
          className={clsx(css.callToAction, css.fullHeight)}
          onClick={handleClick}
        >
          {callToAction}
        </Button>
      )}
    </div>
  )
}
