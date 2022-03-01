/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Browser detection via feature checks
 * Taken from: https://stackoverflow.com/a/9851769
 */
declare const InstallTrigger: any

function isWindowDefined() {
  if (typeof window === 'undefined') return false

  return true
}

// Opera 8.0+
export function isOpera() {
  if (!isWindowDefined()) return false

  return (
    (!!window['opr'] && !!window['opr'].addons) ||
    !!window['opera'] ||
    navigator.userAgent.includes(' OPR/')
  )
}

// Firefox 1.0+
export function isFirefox() {
  if (!isWindowDefined()) return false

  return typeof InstallTrigger !== 'undefined'
}

// Safari 3.0+ "[object HTMLElementConstructor]"
export function isSafari() {
  if (!isWindowDefined()) return false

  return (
    /constructor/i.test(window['HTMLElement'] as any) ||
    (function (p) {
      return p.toString() === '[object SafariRemoteNotification]'
    })(
      !window['safari'] ||
        (typeof window['safari'] !== 'undefined' &&
          window['safari'].pushNotification)
    )
  )
}

// Internet Explorer 6-11
export function isIE() {
  if (!isWindowDefined()) return false

  return /*@cc_on!@*/ false || !!document['documentMode']
}

// Edge 20+
export function isEdge() {
  if (!isWindowDefined()) return false

  return !isIE && !!window['StyleMedia']
}

// Chrome 1 - 79
export function isChrome() {
  if (!isWindowDefined()) return false

  return (
    !!window['chrome'] &&
    (!!window['chrome']?.webstore || !!window['chrome']?.runtime)
  )
}

// Edge (based on chromium) detection
export function isEdgeChromium() {
  if (!isWindowDefined()) return false

  return isChrome && navigator.userAgent.includes('Edg')
}

// Blink engine detection
export function isBlink() {
  return (isChrome || isOpera) && !!window.CSS
}
