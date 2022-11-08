// Ideally these should be imported from jest... But they are not easily available

export type FunctionLike = (...args: any[]) => unknown

export type MethodLikeKeys<T> = {
  [K in keyof T]: T[K] extends FunctionLike ? K : never
}[keyof T]
