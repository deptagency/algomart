import { createFetcherClient, FetcherOptions } from '@algomart/shared/utils'
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query'
import * as jwt from 'jsonwebtoken'

import { AppConfig } from '@/config'

async function bearerToken() {
  const TEN_MIN_IN_SECONDS = 60 * 10
  const CURRENT_TIME_IN_SECONDS = Date.now() / 1000
  const { getAuth } = await import('firebase/auth')
  const auth = getAuth()
  if (!auth.currentUser) return null

  let token = await auth.currentUser?.getIdToken()
  const { exp } = jwt.decode(token, { json: true })

  // If expiring within 10 minutes, force refresh
  if (CURRENT_TIME_IN_SECONDS > exp - TEN_MIN_IN_SECONDS) {
    token = await auth.currentUser?.getIdToken(true)
  }

  return token
}

export const apiFetcher = (
  overrideOptions: Partial<Omit<FetcherOptions, 'method'>> = {}
) =>
  createFetcherClient({
    baseURL: AppConfig.apiURL,
    bearerToken,
    ...overrideOptions,
  })

export const localFetcher = (overrideOptions: Partial<FetcherOptions> = {}) =>
  createFetcherClient({
    bearerToken,
    ...overrideOptions,
  })

export interface ErrorResponse {
  error: string
  message?: string
  statusCode: number
}

export function useWebAPI<T>(
  url: string | null,
  options: UseQueryOptions<T> = {},
  queryKey?: QueryKey
) {
  const defaultEnabled = 'enabled' in options ? options.enabled : true
  return useQuery<T, ErrorResponse>(
    queryKey || [url],
    ({ signal }) =>
      localFetcher().get<T>(url, {
        fetchOptions: { signal },
      }),
    {
      ...options,
      enabled: !!url && defaultEnabled,
    }
  )
}

export function useAPI<T>(
  key: QueryKey,
  url: string | null,
  options: UseQueryOptions<T> = {}
) {
  const endpoint = url ? AppConfig.apiURL + url : undefined
  const defaultEnabled = 'enabled' in options ? options.enabled : true
  return useQuery<T>(
    key,
    ({ signal }) =>
      apiFetcher().get<T>(endpoint, {
        fetchOptions: {
          signal,
        },
      }),
    {
      // Disable refetching on window focus by default
      refetchOnWindowFocus: false,
      ...options,
      enabled: !!endpoint && defaultEnabled,
    }
  )
}
