import { FileWithPreview } from '@/types/file'
export interface AuthState {
  error: string | null
  method: 'email' | 'google' | null
  status: 'loading' | 'error' | 'authenticated' | 'anonymous'
  user: Partial<Profile> | null
}

export interface AuthUtils extends AuthState {
  authenticateWithEmailAndPassword: (
    payload: SignInPayload
  ) => Promise<{ isValid: boolean }>
  authenticateWithGoogle: () => Promise<void>
  getRedirectPath: () => string | null
  registerWithEmailAndPassword: (
    payload: SignUpPayload
  ) => Promise<{ isValid: boolean }>
  reloadProfile: () => Promise<void>
  sendNewEmailVerification: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<{ isValid: boolean }>
  setRedirectPath: (urlPath: string | null) => void
  signOut: () => Promise<void>
  updateAuthSession: (password: string) => Promise<{ isValid: boolean }>
  updateEmailAddress: (newEmail: string) => Promise<{ isValid: boolean }>
  updateProfilePic: (profilePic: FileWithPreview | null) => Promise<void>
}

export interface Profile {
  email: string | null
  emailVerified: boolean
  name: string | null
  photo: string | null
  token: string
  uid: string
  username: string | null
  address: string | null
}

export interface SignInPayload {
  email: string
  password: string
}

export interface SignUpPayload {
  email: string
  password: string
  passphrase: string
  profilePic: FileWithPreview | null
  username: string
}
