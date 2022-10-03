import clsx from 'clsx'
import { Popover as TinyPopover, PopoverProps } from 'react-tiny-popover'

import css from './popover.module.css'

interface IPopover extends PopoverProps {
  noPad?: boolean
  innerClassName?: string
  className?: string
}

/**
A styled wrapper around https://github.com/alexkatz/react-tiny-popover

NOTE: This component injects a `ref` into it's child. That child must either be a React
Element (eg: <div>) or use forwardRef in order for positioning to work.

Read more here: https://github.com/alexkatz/react-tiny-popover#migrating-from-versions-3-and-4
*/
export function Popover({
  className,
  innerClassName,
  content,
  isOpen,
  noPad,
  ...rest
}: IPopover) {
  const wrappedContent = (props) => (
    <div
      className={clsx(css.popoverInner, { [css.noPad]: noPad }, innerClassName)}
    >
      {typeof content === 'function' ? content(props) : content}
    </div>
  )

  return (
    <TinyPopover
      containerClassName={clsx(css.container, className)}
      content={wrappedContent}
      isOpen={isOpen}
      {...rest}
    />
  )
}
