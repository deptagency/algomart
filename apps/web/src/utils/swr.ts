import ky from 'ky'
import useSWR from 'swr'

import { useAuth } from '@/contexts/auth-context'

export interface ErrorResponse {
  error: string
  message?: string
  statusCode: number
}

export async function fetcher(url: string, token?: string) {
  const response = await ky(url, {
    throwHttpErrors: false,
    timeout: 10_000,
    ...(token && {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
  })

  const json = await response.json()

  if (!response.ok) {
    const error: ErrorResponse = json
    throw new Error(error.message || error.error)
  }

  return json
}

export function useApi<T>(
  url: string | null,
  options?: { refreshInterval?: number }
) {
  return useSWR<T, ErrorResponse>(url, fetcher, options)
}

export function useAuthApi<T>(url: string | null) {
  const auth = useAuth()
  return useSWR<T, ErrorResponse>([url, auth.user?.token], fetcher)
}
