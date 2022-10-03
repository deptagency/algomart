import { renderHook } from '@testing-library/react'

import { useDebouncedCallback } from './use-debounced-callback'

import { sleep } from '@/utils/sleep'

test('only calls callback once every 500ms', async () => {
  const callback = jest.fn()

  const { result } = renderHook(() =>
    // We use leading: true to ensure test can run quickly..
    // Otherwise we would have to wait for 200ms before the callback is called
    useDebouncedCallback(callback, 200, { leading: true })
  )

  expect(typeof result.current).toBe('function')

  result.current()
  result.current()

  expect(callback).toHaveBeenCalledTimes(1)
})

test('can call callback again after 200ms', async () => {
  const callback = jest.fn()

  const { result } = renderHook(() =>
    // We use leading: true to ensure test can run quickly..
    // Otherwise we would have to wait for 200ms before the callback is called
    useDebouncedCallback(callback, 200, { leading: true })
  )

  expect(typeof result.current).toBe('function')

  result.current()
  await sleep(300) // Wait a bit extra to ensure the debounce timeout has settled
  result.current()

  expect(callback).toHaveBeenCalledTimes(2)
})
