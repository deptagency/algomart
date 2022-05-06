import axios, { AxiosInstance } from 'axios'

export interface HttpResponse<T = unknown> {
  data: T
  status: number
  headers: Record<string, string>
}

export interface RequestOptions {
  headers?: Record<string, string | number | boolean>
  params?: Record<string, string | number | boolean>
}

export const DEFAULT_TIMEOUT = 10_000

export const validateStatus = (status: number) => status >= 200 && status < 400

export class HttpTransport {
  client: AxiosInstance

  constructor(
    baseURL?: string,
    timeout = DEFAULT_TIMEOUT,
    defaultHeaders: Record<string, string> = {}
  ) {
    this.client = axios.create({
      baseURL,
      responseType: 'json',
      timeout,
      headers: defaultHeaders,
      validateStatus,
    })
  }

  async get<T = unknown>(
    url: string,
    options?: RequestOptions
  ): Promise<HttpResponse<T>> {
    const { data, headers, status } = await this.client.get<T>(url, options)
    return { data, headers, status }
  }

  async post<T = unknown, R = unknown>(
    url: string,
    body?: R,
    options?: RequestOptions
  ): Promise<HttpResponse<T>> {
    const { data, headers, status } = await this.client.post<T>(
      url,
      body,
      options
    )
    return { data, headers, status }
  }

  async patch<T = unknown, R = unknown>(
    url: string,
    body?: R,
    options?: RequestOptions
  ): Promise<HttpResponse<T>> {
    const { data, headers, status } = await this.client.patch<T>(
      url,
      body,
      options
    )
    return { data, headers, status }
  }

  async delete<T = unknown, R = unknown>(
    url: string,
    body?: R,
    options?: RequestOptions
  ): Promise<HttpResponse<T>> {
    const { data, headers, status } = await this.client.delete<T>(url, options)
    return { data, headers, status }
  }

  async put<T = unknown, R = unknown>(
    url: string,
    body?: R,
    options?: RequestOptions
  ): Promise<HttpResponse<T>> {
    const { data, headers, status } = await this.client.put<T>(
      url,
      body,
      options
    )
    return { data, headers, status }
  }

  async stream(url: string): Promise<NodeJS.ReadableStream> {
    const response = await this.client.get(url, {
      responseType: 'stream',
    })

    return response.data
  }
}
