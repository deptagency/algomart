import Router, { useRouter } from 'next/router'
import { useEffect } from 'react'

// From https://github.com/vercel/next.js/issues/2476#issuecomment-843311387
export function useWarningOnExit(shouldWarn: boolean, message: string) {
  const router = useRouter()

  useEffect(() => {
    let isWarned = false

    const routeChangeStart = (url: string) => {
      if (router.asPath !== url && shouldWarn && !isWarned) {
        isWarned = true
        if (window.confirm(message)) {
          router.push(url)
        } else {
          isWarned = false
          router.events.emit('routeChangeError')
          router.replace(Router, router.asPath, { shallow: true })
          // eslint-disable-next-line no-throw-literal
          throw 'Abort route change. Please ignore this error.'
        }
      }
    }

    const beforeUnload = (beforeEvent: BeforeUnloadEvent) => {
      if (shouldWarn && !isWarned) {
        const event = beforeEvent || window.event
        event.returnValue = message
        return message
      }
      return null
    }

    router.events.on('routeChangeStart', routeChangeStart)
    window.addEventListener('beforeunload', beforeUnload)
    router.beforePopState(({ url }) => {
      if (router.asPath !== url && shouldWarn && !isWarned) {
        isWarned = true
        if (window.confirm(message)) {
          return true
        } else {
          isWarned = false
          window.history.pushState(null, '', url)
          router.replace(Router, router.asPath, { shallow: true })
          return false
        }
      }
      return true
    })

    return () => {
      router.events.off('routeChangeStart', routeChangeStart)
      window.removeEventListener('beforeunload', beforeUnload)
      router.beforePopState(() => {
        return true
      })
    }
  }, [message, router, shouldWarn])
}
