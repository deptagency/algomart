import { useEffect } from 'react'
import { ExtractError, ValidatorTest } from 'validator-fns'

// Gets the offset of the top of the element
// relative to the top of the page
function getOffsetTop(element: HTMLElement) {
  let offsetTop = 0
  do {
    if (!Number.isNaN(element.offsetTop)) {
      offsetTop += element.offsetTop
    }
  } while ((element = element.offsetParent as HTMLElement))
  return offsetTop
}

// Checks if an element is in the viewport
function isInViewport(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  const html = document.documentElement
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || html.clientHeight) &&
    rect.right <= (window.innerWidth || html.clientWidth)
  )
}

// Will scroll the top most field with an error into view
// if it is not already in view
export function useScrollToHighestErrorField(
  formErrors: ExtractError<ValidatorTest>
) {
  useEffect(() => {
    if (Object.keys(formErrors).length > 0) {
      const elementKeyedByOffset: Record<number, HTMLElement> = {}
      for (const key of Object.keys(formErrors)) {
        const element = document.querySelector<HTMLElement>(`[name="${key}"]`)
        if (element) {
          elementKeyedByOffset[getOffsetTop(element)] = element
        }
      }
      const highestInForm = Math.min(
        ...Object.keys(elementKeyedByOffset).map(Number)
      )
      const element = elementKeyedByOffset[highestInForm]
      if (element && !isInViewport(element)) {
        element.parentElement.parentElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest',
        })
      }
    }
  }, [formErrors])
}
