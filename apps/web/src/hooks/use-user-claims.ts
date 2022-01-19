import configureAdmin from '@/clients/firebase-admin-client'
import { useAuth } from '@/contexts/auth-context'

export async function useClaims() {
  const auth = useAuth()
  const user = await configureAdmin().auth().getUser(auth.user.uid)
  return user.toJSON()
}
