import { useEffect, useRef } from 'react'

type Callback = () => void
const noop = () => void 0

export function useInterval(callback: Callback, delay: number | null | false) {
  const savedCallback = useRef<Callback>(noop)

  useEffect(() => {
    savedCallback.current = callback
  })

  useEffect(() => {
    if (typeof delay !== 'number') return
    const tick = () => savedCallback.current()
    const id = setInterval(tick, delay)
    return () => clearInterval(id)
  }, [delay])
}
