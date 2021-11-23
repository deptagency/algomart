import { DEFAULT_LOCALE } from '@algomart/schemas'
import { useRouter } from 'next/router'

export function useLocale() {
  const router = useRouter()
  return router?.locale ?? DEFAULT_LOCALE
}
