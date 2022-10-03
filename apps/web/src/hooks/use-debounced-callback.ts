import { DebouncedFunc, DebounceSettings } from 'lodash'
import debounce from 'lodash/debounce'
import { useMemo } from 'react'

export function useDebouncedCallback<T extends (...args: any[]) => unknown>(
  callback: T,
  wait: number,
  options?: DebounceSettings
): DebouncedFunc<T> {
  return useMemo(
    () => debounce(callback, wait, options),
    [callback, wait, options]
  )
}
