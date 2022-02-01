import React, { FC } from 'react'

export interface FlexProps {
  /** This aligns a flex container's lines within when there is extra space in the cross-axis, similar to how justify-content aligns individual items within the main-axis. Note: this property has no effect when there is only one line of flex items. */
  alignContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'stretch'
  /** This defines the default behaviour for how flex items are laid out along the cross axis on the current line. Think of it as the justify-content version for the cross-axis (perpendicular to the main-axis). */
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch'
  /** Component contents. __Note__: You cannot pass plain text nodes to this component. */
  /** This allows the default alignment (or the one specified by align-items on
  a flex container) to be overridden for individual flex items. */
  alignSelf?:
    | 'auto'
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'baseline'
    | 'stretch'
  /** Container class name */
  className?: string
  /** This is the shorthand for flexGrow, flexShrink and flexBasis combined.
  The second and third parameters (flexShrink and flexBasis) are optional.
  Default is `0 1 auto`. */
  flex?: string
  /** This defines the default size of an element before the remaining space is
  distributed. It can be a length (e.g. 20%, 5rem, etc.) or a keyword. The auto
  keyword means "look at my width or height property". */
  flexBasis?: string
  /** This establishes the main-axis, thus defining the direction flex items are placed in the flex container. Flexbox is (aside from optional wrapping) a single-direction layout concept. Think of flex items as primarily laying out either in horizontal rows or vertical columns. */
  flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse'
  /** This defines the ability for a flex item to grow if necessary. It accepts
  a unitless value that serves as a proportion. It dictates what amount of the
  available space inside the flex container the item should take up.

  If all items have flex-grow set to 1, the remaining space in the container
  will be distributed equally to all children. If one of the children has a
  value of 2, the remaining space would take up twice as much space as the
  others (or it will try to, at least). */
  flexGrow?: string | number
  /** This defines the ability for a flex item to shrink if necessary. */
  flexShrink?: string | number
  /** By default, flex items will all try to fit onto one line. You can change that and allow the items to wrap as needed with this property. */
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  /** If true the container will be set to `display: inline-flex` instead of `display: flex`. */
  inline?: boolean
  /** If the `item` prop is set to true then it will use `display: block`.
  Do not use this flag if your item is also a flex container. */
  item?: boolean
  /** This defines the alignment along the main axis. It helps distribute extra free space left over when either all the flex items on a line are inflexible, or are flexible but have reached their maximum size. It also exerts some control over the alignment of items when they overflow the line. */
  justifyContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
  /** By default, flex items are laid out in the source order. However, the
  order prop controls the order in which they appear in the flex container. */
  order?: string | number
  /** Gap between items. Must be a valid spacing size. */
  gap?: number
  /** Container style attribute */
  style?: object
  /** Test id for automation */
  testId?: string
}

/**
A flex container for laying out children. This component provides most flex
container functionality with the added ability to specify an internal `gap`
between items.

For more help with flexbox see: https://css-tricks.com/snippets/css/a-guide-to-flexbox/
*/
export const Flex: FC<FlexProps> = ({
  alignContent,
  alignItems,
  alignSelf,
  children,
  className,
  flex,
  flexBasis = 'auto',
  flexDirection,
  flexGrow = 0,
  flexShrink = 1,
  flexWrap,
  gap,
  inline,
  item,
  justifyContent,
  order,
  style,
  testId,
}) => {
  flex = flex || `${flexGrow} ${flexShrink} ${flexBasis}`

  style = {
    display: item ? 'block' : inline ? 'inline-flex' : 'flex',
    alignContent,
    alignItems,
    flexDirection,
    flexWrap,
    justifyContent,
    flex,
    alignSelf,
    order,
    ...style,
  }
  return (
    <div
      style={{ gap: `${gap * 0.25}rem`, ...style }}
      className={className}
      data-testid={testId}
    >
      {children}
    </div>
  )
}
