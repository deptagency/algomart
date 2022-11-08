export type URLSearchParamsInit =
  | string
  | string[][]
  | Record<string, string>
  | URLSearchParams

export interface FetcherOptions {
  baseURL: string
  bearerToken: string | (() => Promise<string>)
  body: BodyInit
  key: string
  cache: boolean
  fetchOptions: RequestInit
  formData: FormData
  headers: HeadersInit
  json: unknown
  method: 'HEAD' | 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  searchParams: URLSearchParamsInit
  throwOnError: boolean
  timeoutInMilliseconds: number
}

export interface FetcherResponse<D> {
  data: D
  headers: Record<string, string>
  ok: boolean
  status: number
}

export class FetcherError extends Error {
  constructor(message: string, public readonly response: Response) {
    super(message)
    this.name = 'FetcherError'
  }
}

const DEFAULT_TIMEOUT_IN_MS = 10_000
const responseCache = new Map<string, Promise<Response>>()
const abortCache = new Map<string, AbortController>()

export function deleteCacheByKey(key: string) {
  return responseCache.delete(key)
}

export function clearCache() {
  responseCache.clear()
}

export function abortRequestByKey(key: string) {
  if (abortCache.has(key)) {
    abortCache.get(key).abort()
    abortCache.delete(key)
  }
}

async function handleResponse<D>(
  response: Response,
  {
    method,
    throwOnError,
  }: Partial<Pick<FetcherOptions, 'throwOnError' | 'method'>>
): Promise<FetcherResponse<D>> {
  if (!response.ok && throwOnError) {
    let errorMessage: string

    try {
      errorMessage = JSON.parse(await response.text())?.message
    } catch {
      // noop
    }

    throw new FetcherError(
      errorMessage || `Failed to ${method ?? 'GET'} ${response.url}`,
      response
    )
  }

  return {
    data: response.status !== 204 ? await response.json() : undefined,
    headers: Object.fromEntries(response.headers.entries()),
    ok: response.ok,
    status: response.status,
  }
}

export async function fetcher<D = unknown>(
  path: string,
  {
    baseURL,
    bearerToken,
    body = null,
    cache,
    fetchOptions = {} as RequestInit,
    formData,
    headers: initialHeaders,
    json,
    key,
    method = 'GET',
    searchParams,
    throwOnError = true,
    timeoutInMilliseconds = DEFAULT_TIMEOUT_IN_MS,
  }: Partial<FetcherOptions> = {}
): Promise<FetcherResponse<D>> {
  if (typeof window === 'undefined' && !baseURL) {
    throw new TypeError('baseURL is required on server')
  }

  if (cache && key && responseCache.has(key)) {
    const cachedResponse = responseCache.get(key)
    return await handleResponse<D>(await cachedResponse, {
      method,
      throwOnError,
    })
  }

  let url = baseURL ? new URL(path, baseURL) : path
  const controller = new AbortController()
  const headers = new Headers(initialHeaders)

  if (!fetchOptions.signal && key) {
    abortRequestByKey(key)
    abortCache.set(key, controller)
  }

  if (searchParams) {
    const search = new URLSearchParams(searchParams).toString()
    if (url instanceof URL) {
      url.search = search
    } else {
      url += (url.includes('?') ? '&' : '?') + search
    }
  }

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  if (bearerToken) {
    const token =
      typeof bearerToken === 'function' ? await bearerToken() : bearerToken

    // Need the extra check in case the async bearerToken returns an empty value
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  if (!body && method !== 'GET') {
    if (json) {
      headers.set('Content-Type', 'application/json')
      body = JSON.stringify(json)
    } else if (formData) {
      body = formData
    }
  }

  const timer = setTimeout(() => {
    !fetchOptions.signal && controller.abort()
  }, timeoutInMilliseconds ?? DEFAULT_TIMEOUT_IN_MS)

  const responsePromise = fetch(url, {
    body,
    headers,
    method,
    signal: controller.signal,
    ...fetchOptions,
  })

  if (cache && key) {
    responseCache.set(key, responsePromise)
  }

  try {
    return await handleResponse<D>(await responsePromise, {
      method,
      throwOnError,
    })
  } finally {
    clearTimeout(timer)
  }
}

export interface FetcherClient {
  get<D>(path: string, options?: Partial<FetcherOptions>): Promise<D>
  head<D>(path: string, options?: Partial<FetcherOptions>): Promise<D>
  post<D>(path: string, options?: Partial<FetcherOptions>): Promise<D>
  put<D>(path: string, options?: Partial<FetcherOptions>): Promise<D>
  patch<D>(path: string, options?: Partial<FetcherOptions>): Promise<D>
  delete<D>(path: string, options?: Partial<FetcherOptions>): Promise<D>
}

const methods: FetcherOptions['method'][] = [
  'DELETE',
  'GET',
  'HEAD',
  'PATCH',
  'POST',
  'PUT',
]

export function createFetcherClient(
  baseOptions: Partial<Omit<FetcherOptions, 'method'>> = {}
): FetcherClient {
  return Object.freeze({
    ...Object.fromEntries(
      methods.map((method) => [
        method.toLowerCase(),
        <T>(path: string, options: Partial<FetcherOptions> = {}) =>
          fetcher<T>(path, {
            method,
            key: `${path}-${method}`,
            ...baseOptions,
            ...options,
          }).then(({ data }) => data),
      ])
    ),
  }) as unknown as FetcherClient
}
