import { UserAccountProvider } from '@algomart/schemas'

import { FileWithPreview } from '@/types/file'

export interface Profile {
  address: string | null
  age: number | null
  balance: number | null
  currency: string | null
  email: string | null
  emailVerified: boolean
  language: string | null
  name: string | null
  photo: string | null
  provider: UserAccountProvider | null
  token: string
  uid: string
  username: string | null
}

export interface SignInPayload {
  email: string
  password: string
}

export interface SignUpPayload {
  currency: string
  email: string
  language: string
  password: string
  profilePic: FileWithPreview | null
  username: string
}
