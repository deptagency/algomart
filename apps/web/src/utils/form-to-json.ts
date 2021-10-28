export function toJSON<T = unknown>(formData: FormData) {
  const out: Record<string, unknown> = {}
  const keys = [...formData.keys()]
  for (const key of keys) {
    const value = formData.getAll(key)
    out[key] = value.length === 1 ? value[0] : value
  }
  return out as T
}
