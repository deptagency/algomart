import clsx from 'clsx'
import React from 'react'

import css from './ellipsis-loader.module.css'

interface EllipsisLoaderProps {
  inline?: boolean
  className?: string
}

/**
Simple animated ellipsis to show a loading state.
Inherits it's font styles and color from the dom.
*/
const EllipsisLoader: React.FC<EllipsisLoaderProps> = ({
  inline,
  className,
  ...rest
}) => {
  return (
    <div className={clsx(className, { [css.inline]: inline })} {...rest}>
      <div className={css.dot}>.</div>
      <div className={css.dot}>.</div>
      <div className={css.dot}>.</div>
    </div>
  )
}

export default EllipsisLoader
