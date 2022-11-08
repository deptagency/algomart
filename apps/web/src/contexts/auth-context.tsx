import {
  CURRENCY_COOKIE,
  LANG_COOKIE,
  PublicAccount,
  UserAccountProvider,
} from '@algomart/schemas'
import { FetcherError } from '@algomart/shared/utils'
import {
  Auth,
  confirmPasswordReset,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithRedirect,
  Unsubscribe,
  User,
  verifyPasswordResetCode,
} from 'firebase/auth'
import { useRouter } from 'next/router'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react'
import { v4 as uuid } from 'uuid'

import { useWalletConnectContext } from '@/contexts/wallet-connect-context'
import { useFirebaseApp } from '@/hooks/use-firebase-app'
import { AuthService } from '@/services/auth-service'
import { Profile, SignInPayload, SignUpPayload } from '@/types/auth'
import { FileWithPreview } from '@/types/file'
import { getCookie, removeCookie, setCookie } from '@/utils/cookies-web'
import { apiFetcher } from '@/utils/react-query'
import {
  ActionsUnion,
  createAction,
  createActionPayload,
} from '@/utils/reducer'
import { urls } from '@/utils/urls'

export const TOKEN_COOKIE_NAME = 'token'
export const TOKEN_COOKIE_EXPIRES_IN_DAYS = 1

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
  confirmPassword: (code: string, password: string) => Promise<void>
  getRedirectPath: () => string | null
  /** Redirects the user back to where they were before the login/signup flow. */
  completeRedirect: (defaultRedirect?: string, locale?: string) => void
  registerWithEmailAndPassword: (
    payload: SignUpPayload
  ) => Promise<{ isValid: boolean; error?: string }>
  reloadProfile: () => Promise<void>
  resetAuthErrors: () => void
  sendNewEmailVerification: () => Promise<{ isValid: boolean }>
  sendPasswordReset: (email: string) => Promise<{ isValid: boolean }>
  verifyResetPasswordCode: (code: string) => Promise<string>
  verifyEmailVerificationCode: (code: string) => Promise<void>
  setRedirectPath: (urlPath: string | null) => void
  signOut: () => Promise<void>
  updateAuthSession: (password: string) => Promise<{ isValid: boolean }>
  updateEmailAddress: (newEmail: string) => Promise<{ isValid: boolean }>
  updateProfilePic: (profilePic: FileWithPreview | null) => Promise<void>
}

const SET_ANONYMOUS = 'SET_ANONYMOUS'
const SET_ERROR = 'SET_ERROR'
const SET_LOADING = 'SET_LOADING'
const SET_METHOD = 'SET_METHOD'
const SET_USER = 'SET_USER'
const SIGN_OUT = 'SIGN_OUT'

const authActions = {
  setAnonymous: createAction<typeof SET_ANONYMOUS>(SET_ANONYMOUS),
  setError: createActionPayload<typeof SET_ERROR, string>(SET_ERROR),
  setLoading: createAction<typeof SET_LOADING>(SET_LOADING),
  setMethod: createActionPayload<typeof SET_METHOD, AuthState['method']>(
    SET_METHOD
  ),
  setUser: createActionPayload<typeof SET_USER, AuthState['user']>(SET_USER),
  signOut: createAction<typeof SIGN_OUT>(SIGN_OUT),
}

function authReducer(
  state: AuthState,
  action: ActionsUnion<typeof authActions>
): AuthState {
  switch (action.type) {
    case SET_ANONYMOUS:
      return { ...state, error: null, status: 'anonymous' }
    case SET_ERROR:
      return { ...state, error: action.payload, status: 'error' }
    case SET_LOADING:
      return { ...state, error: null, status: 'loading' }
    case SET_METHOD:
      return { ...state, method: action.payload }
    case SET_USER:
      return { ...state, user: action.payload, status: 'authenticated' }
    case SIGN_OUT:
      return {
        ...state,
        error: null,
        method: null,
        status: 'anonymous',
        user: null,
      }
    default:
      return state
  }
}

async function mapUserToProfile(
  user: Exclude<Auth['currentUser'], null>
): Promise<Profile> {
  return {
    address: null,
    age: null,
    balance: null,
    currency: null,
    email: user.email,
    emailVerified: user.emailVerified,
    language: null,
    name: user.displayName,
    photo: user.photoURL,
    provider: null,
    token: await user.getIdToken(),
    uid: user.uid,
    username: null,
  }
}

export const AuthContext = createContext<AuthUtils | null>(null)

async function getFirebaseAuthAsync() {
  return import('firebase/auth')
}

async function getFirebaseStorageAsync() {
  return import('firebase/storage')
}

export function useAuth(throwError = true) {
  const auth = useContext(AuthContext)
  if (!auth && throwError) {
    throw new Error('AuthProvider missing')
  }

  const isAuthenticating = auth?.status === 'loading'
  const isAuthenticated = auth?.status === 'authenticated'
  const isRegistered = !!(auth.user?.username && auth.user?.address)
  const isNeedsSetup = isAuthenticated && !isRegistered && auth.user

  return {
    ...auth,
    isAuthenticating,
    isAuthenticated,
    isRegistered,
    isNeedsSetup,
  }
}

export function useAuthProvider() {
  const firebaseApp = useFirebaseApp()
  const { push } = useRouter()
  const { handleDisconnect: handleWalletConnectDisconnect } =
    useWalletConnectContext()

  const [state, dispatch] = useReducer(authReducer, {
    error: null,
    method: null,
    status: 'loading',
    user: null,
  })

  const verifyResetPasswordCode = useCallback(
    async (code: string) => {
      if (firebaseApp) {
        const { getAuth } = await getFirebaseAuthAsync()
        const auth = getAuth(firebaseApp)
        const email = await verifyPasswordResetCode(auth, code)
        return email
      }
    },
    [firebaseApp]
  )

  const confirmPassword = useCallback(
    async (code: string, password: string) => {
      const { getAuth } = await getFirebaseAuthAsync()
      const auth = getAuth(firebaseApp)
      await confirmPasswordReset(auth, code, password)
    },
    [firebaseApp]
  )

  const reloadProfile = useCallback(async () => {
    const { getAuth } = await getFirebaseAuthAsync()
    const auth = getAuth(firebaseApp)
    const token = await auth.currentUser?.getIdToken(true)

    if (auth.currentUser && token) {
      setCookie(TOKEN_COOKIE_NAME, token, TOKEN_COOKIE_EXPIRES_IN_DAYS)

      // Get profile
      const profile = await mapUserToProfile(auth.currentUser)
      const profileResponse = await apiFetcher({
        bearerToken: token,
      })
        .get<PublicAccount | null>(urls.api.accounts.base)
        .catch(() => null)

      // Only continue if profile found without error
      if (profileResponse === null) {
        dispatch(authActions.setAnonymous())
        return
      }

      /**
       * When an email user changes their email address,
       * we update the record in our our DB. But if the user
       * revokes the email update, it swiches back to their previous email.
       * In this event, the email in our DB is incorrect, so we update
       * it to use the Firebase email (which is the source of truth).
       * */
      if (profileResponse.email !== auth.currentUser?.email) {
        await AuthService.instance.updateEmail(auth.currentUser.email)
      }

      /**
       * If an anonymous user changes their preferred language, then logs in,
       * we need to update the db to reflect this preference
       */
      const languageCookie = getCookie(LANG_COOKIE)
      const parsedLanguageCookie =
        languageCookie && languageCookie !== 'null' ? languageCookie : null
      if (
        parsedLanguageCookie &&
        profileResponse.language !== parsedLanguageCookie
      ) {
        await AuthService.instance.updateLanguage(parsedLanguageCookie)
      }

      /**
       * If an anonymous user changes their preferred currency, then logs in,
       * we need to update the db to reflect this preference
       */
      const currencyCookie = getCookie(CURRENCY_COOKIE)
      const parsedCurrencyCookie =
        currencyCookie && currencyCookie !== 'null' ? currencyCookie : null
      if (
        parsedCurrencyCookie &&
        profileResponse.currency !== parsedCurrencyCookie
      ) {
        await AuthService.instance.updateCurrency(parsedCurrencyCookie)
      }

      // Set user
      dispatch(
        authActions.setUser({
          ...profile,
          address: profileResponse?.address || null,
          age: profileResponse.age || null,
          balance: !Number.isNaN(profileResponse.balance)
            ? profileResponse.balance
            : null,
          currency: profileResponse?.currency || null,
          emailVerified: profile.emailVerified,
          language: profileResponse?.language || null,
          provider: profileResponse?.provider || null,
          username: profileResponse?.username || null,
        })
      )
    }
  }, [firebaseApp])

  const verifyEmailVerificationCode = useCallback(
    async (code: string) => {
      if (firebaseApp) {
        const { getAuth, applyActionCode } = await getFirebaseAuthAsync()
        const auth = getAuth(firebaseApp)

        // Apply email verification code
        await applyActionCode(auth, code)

        // Cache bust the currentUser object to get updated emailVerified`value
        await auth.currentUser.reload()

        // Reload profile to update cookies, state, etc
        await reloadProfile()
      }
    },
    [firebaseApp, reloadProfile]
  )

  const getRedirectPath = useCallback(() => {
    return window.localStorage.getItem('redirect')
  }, [])

  const setRedirectPath = useCallback((urlPath: string | null) => {
    window.localStorage.setItem('redirect', urlPath ?? '')
  }, [])

  const completeRedirect = useCallback(
    (defaultRedirect = urls.home, locale?: string) => {
      const redirectPath = getRedirectPath()
      if (redirectPath) {
        setRedirectPath(null)
        window.location.pathname = redirectPath
      } else {
        push(defaultRedirect, undefined, {
          locale,
        })
      }
    },
    [getRedirectPath, push, setRedirectPath]
  )

  const sendNewEmailVerification = useCallback(async () => {
    try {
      await apiFetcher().post<void>(urls.api.accounts.sendNewEmailVerification)
      return { isValid: true }
    } catch {
      // Do nothing
    }
  }, [])

  const sendPasswordReset = useCallback(async (email: string) => {
    try {
      await apiFetcher().post(urls.api.accounts.sendPasswordReset, {
        json: { email },
      })
      return { isValid: true }
    } catch {
      // For security purposes, suppress error even if user doesn't exist
      return { isValid: true }
    }
  }, [])

  const updateAuthSession = useCallback(
    async (password: string) => {
      const { getAuth, EmailAuthProvider, reauthenticateWithCredential } =
        await getFirebaseAuthAsync()
      const auth = getAuth(firebaseApp)
      if (auth?.currentUser?.email) {
        try {
          // Reauthenticate user
          const credential = EmailAuthProvider.credential(
            auth.currentUser.email,
            password
          )
          await reauthenticateWithCredential(auth.currentUser, credential)
          return { isValid: true }
        } catch {
          return { isValid: false }
        }
      }
      return { isValid: false }
    },
    [firebaseApp]
  )

  const updateEmailAddress = useCallback(
    async (newEmail: string) => {
      const { getAuth, updateEmail } = await getFirebaseAuthAsync()
      const auth = getAuth(firebaseApp)
      if (auth?.currentUser?.email) {
        try {
          // Update user's firebase account and trigger re-verification
          await updateEmail(auth.currentUser, newEmail)

          // Persist in local database
          await AuthService.instance.updateEmail(newEmail)
          await sendNewEmailVerification()

          await reloadProfile()
          return { isValid: true }
        } catch {
          return { isValid: false }
        }
      }
      return { isValid: false }
    },
    [firebaseApp, reloadProfile, sendNewEmailVerification]
  )

  const updateProfilePic = useCallback(
    async (profilePic: FileWithPreview | null) => {
      const { getAuth, updateProfile } = await getFirebaseAuthAsync()
      const { ref, getStorage, uploadBytes, getDownloadURL } =
        await getFirebaseStorageAsync()

      const auth = getAuth(firebaseApp)

      if (auth.currentUser) {
        let photoURL = ''

        if (profilePic) {
          const extension = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
          }[profilePic.type]

          if (!extension) {
            return
          }

          const filename = uuid() + extension

          const storageReference = ref(
            getStorage(firebaseApp),
            `/users/${auth.currentUser.uid}/${filename}`
          )

          await uploadBytes(storageReference, profilePic, {
            customMetadata: {
              name: profilePic.name,
            },
          })

          photoURL = await getDownloadURL(storageReference)
        }

        await updateProfile(auth.currentUser, { photoURL })

        return await reloadProfile()
      }
      return
    },
    [firebaseApp, reloadProfile]
  )

  const registerWithEmailAndPassword = useCallback(
    async ({
      currency,
      email,
      language,
      password,
      profilePic,
      username,
    }: SignUpPayload) => {
      dispatch(authActions.setLoading())
      const { getAuth, createUserWithEmailAndPassword, deleteUser } =
        await getFirebaseAuthAsync()
      const auth = getAuth(firebaseApp)

      let user: User
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        )

        user = userCredential.user
      } catch {
        dispatch(authActions.signOut())
        return {
          isValid: false,
          error: 'duplicate-email',
        }
      }

      if (user) {
        try {
          await apiFetcher().post<PublicAccount>(urls.api.accounts.base, {
            json: {
              currency,
              email,
              username,
              language,
              provider: UserAccountProvider.Email,
            },
          })
        } catch (error) {
          if (error instanceof FetcherError) {
            await deleteUser(user)
            dispatch(authActions.signOut())

            if (error.response.status === 409) {
              return { isValid: false, error: 'duplicate-username' }
            }
            dispatch(authActions.setError('bad-request'))
            return { isValid: false }
          }
          return { isValid: false }
        }

        if (profilePic) {
          await updateProfilePic(profilePic)
        }

        await sendNewEmailVerification()

        return { isValid: true }
      }
      return { isValid: false }
    },
    [firebaseApp, updateProfilePic, sendNewEmailVerification]
  )

  const resetAuthErrors = useCallback(() => {
    dispatch(authActions.setError(null))
  }, [])

  const authenticateWithEmailAndPassword = useCallback(
    async ({ email, password }: SignInPayload) => {
      dispatch(authActions.setLoading())
      try {
        const { getAuth, signInWithEmailAndPassword, deleteUser } =
          await getFirebaseAuthAsync()
        const auth = getAuth(firebaseApp)
        await signInWithEmailAndPassword(auth, email, password)

        // With new firebase token, create a UserAccount row in the db if necessary
        const user = auth.currentUser
        const token = await user?.getIdToken(true)
        try {
          await apiFetcher().post<PublicAccount>(urls.api.accounts.base, {
            json: {
              provider: UserAccountProvider.Email,
              email: user?.email,
            },
            bearerToken: token,
          })
        } catch (error) {
          if (error instanceof FetcherError) {
            // We failed to create the user in our DB, delete the Firebase user
            await deleteUser(user)
            dispatch(authActions.signOut())
            throw error
          }
          return { isValid: false }
        }

        await reloadProfile()

        return { isValid: true }
      } catch (error) {
        if (error instanceof Error) {
          dispatch(authActions.setError(error.message))
        }
        return { isValid: false }
      }
    },
    [firebaseApp, reloadProfile]
  )

  const authenticateWithGoogle = useCallback(async () => {
    dispatch(authActions.setLoading())
    const { getAuth } = await getFirebaseAuthAsync()
    const auth = getAuth(firebaseApp)
    await signInWithRedirect(auth, new GoogleAuthProvider())
  }, [firebaseApp])

  const signOut = useCallback(async () => {
    dispatch(authActions.setLoading())
    removeCookie(TOKEN_COOKIE_NAME)
    const { getAuth } = await getFirebaseAuthAsync()
    await getAuth(firebaseApp).signOut()
    dispatch(authActions.signOut())
    await handleWalletConnectDisconnect()
  }, [firebaseApp, handleWalletConnectDisconnect])

  useEffect(() => {
    if (!firebaseApp) {
      return
    }

    let unsubscribe: Unsubscribe | null = null

    ;(async () => {
      const { getAuth } = await getFirebaseAuthAsync()
      const auth = getAuth(firebaseApp)
      unsubscribe = auth.onAuthStateChanged(async (user) => {
        dispatch(authActions.setLoading())
        if (!user) {
          dispatch(authActions.setAnonymous())
          await handleWalletConnectDisconnect()
        } else {
          await reloadProfile()
        }
      })

      const redirectResult = await getRedirectResult(auth)
      const method =
        redirectResult?.providerId === 'google.com' ? 'google' : 'email'

      if (method === 'google') {
        try {
          await apiFetcher().post<PublicAccount>(urls.api.accounts.base, {
            json: {
              provider: UserAccountProvider.Google,
              email: redirectResult?.user?.email,
            },
            // @ts-ignore accessToken exists
            bearerToken: redirectResult?.user?.accessToken,
          })
        } catch (error) {
          if (error instanceof FetcherError) {
            // We failed to create the user in our DB, delete the Firebase user
            // await deleteUser(user)
            dispatch(authActions.signOut())
            throw error
          }
          return { isValid: false }
        }

        await reloadProfile()
      }

      dispatch(authActions.setMethod(method))
    })()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [firebaseApp, handleWalletConnectDisconnect, reloadProfile])

  const value = useMemo(
    () => ({
      error: state.error,
      method: state.method,
      status: state.status,
      user: state.user,
      authenticateWithEmailAndPassword,
      authenticateWithGoogle,
      confirmPassword,
      verifyEmailVerificationCode,
      getRedirectPath,
      completeRedirect,
      registerWithEmailAndPassword,
      reloadProfile,
      resetAuthErrors,
      verifyResetPasswordCode,
      sendNewEmailVerification,
      sendPasswordReset,
      setRedirectPath,
      signOut,
      updateAuthSession,
      updateEmailAddress,
      updateProfilePic,
    }),
    [
      state.error,
      state.method,
      state.status,
      state.user,
      authenticateWithEmailAndPassword,
      authenticateWithGoogle,
      confirmPassword,
      getRedirectPath,
      completeRedirect,
      registerWithEmailAndPassword,
      reloadProfile,
      resetAuthErrors,
      sendNewEmailVerification,
      sendPasswordReset,
      setRedirectPath,
      signOut,
      updateAuthSession,
      updateEmailAddress,
      updateProfilePic,
      verifyResetPasswordCode,
      verifyEmailVerificationCode,
    ]
  )
  return value
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useAuthProvider()
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
