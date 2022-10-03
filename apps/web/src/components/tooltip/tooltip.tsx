import { InformationCircleIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import React, { ReactNode, useRef, useState } from 'react'
import {
  ArrowContainer,
  ContentRenderer,
  Popover,
  PopoverPosition,
  PopoverProps,
  PopoverState,
} from 'react-tiny-popover'

import css from './tooltip.module.css'

export interface TooltipProps
  extends Omit<PopoverProps, 'content' | 'isOpen' | 'children'> {
  /** Content to show the tooltip for (if omitted an info icon is shown) */
  children?: ReactNode
  className?: string
  /** tooltip content */
  content?: ReactNode | ContentRenderer
  /** duration (in ms) to wait before showing tooltip on hover */
  delay?: number
  /** classname for info icon */
  iconClassName?: string
  /** tooltip open state is managed internally but overrideable */
  isOpen?: boolean
  /** tooltip position */
  position?: PopoverPosition
}

/**
A styled wrapper around https://github.com/alexkatz/react-tiny-popover
*/
export default function Tooltip({
  children,
  className,
  iconClassName,
  content,
  delay = 400,
  position = 'top',
  ...rest
}: TooltipProps) {
  const [shown, setShown] = useState(false)
  const timeout = useRef<NodeJS.Timeout>()

  if (!content) {
    return <span>{children}</span>
  }

  if (!children) {
    children = (
      <InformationCircleIcon
        className={clsx('inline-block w-4 h-4', iconClassName)}
        tabIndex={0}
        aria-label="tooltip"
        strokeWidth={2.5}
      />
    )
  }

  const show = () => {
    timeout.current = setTimeout(() => setShown(true), delay)
  }

  const hide = () => {
    clearTimeout(timeout.current)
    setShown(false)
  }

  const wrappedContent = (props: PopoverState) => (
    <ArrowContainer {...props} arrowSize={4} arrowColor="#fff">
      <div className={css.popoverInner} aria-live="polite">
        {typeof content === 'function' ? content(props) : content}
      </div>
    </ArrowContainer>
  )

  return (
    <Popover
      padding={12}
      containerClassName={clsx(className, css.containerClassName)}
      content={wrappedContent}
      isOpen={shown}
      positions={[position]}
      {...rest}
    >
      <span
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
    </Popover>
  )
}
