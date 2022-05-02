import { CURRENCY_COOKIE, LANG_COOKIE } from '@algomart/schemas'
import type { Auth, Unsubscribe } from 'firebase/auth'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react'

import { useAnalytics } from '@/hooks/use-analytics'
import { useFirebaseApp } from '@/hooks/use-firebase-app'
import {
  AuthState,
  AuthUtils,
  Profile,
  SignInPayload,
  SignUpPayload,
} from '@/types/auth'
import { FileWithPreview } from '@/types/file'
import { getCookie, removeCookie, setCookie } from '@/utils/cookies-web'
import {
  ActionsUnion,
  createAction,
  createActionPayload,
} from '@/utils/reducer'
import { urls } from '@/utils/urls'

export const TOKEN_COOKIE_NAME = 'token'
export const TOKEN_COOKIE_EXPIRES_IN_DAYS = 1

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
    currency: null,
    email: user.email,
    emailVerified: user.emailVerified,
    language: null,
    name: user.displayName,
    photo: user.photoURL,
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
  return auth
}

export function useAuthProvider() {
  const firebaseApp = useFirebaseApp()
  const analytics = useAnalytics()

  const reloadProfile = useCallback(async () => {
    const { getAuth } = await getFirebaseAuthAsync()
    const auth = getAuth(firebaseApp)
    const token = await auth.currentUser?.getIdToken(true)
    if (auth.currentUser && token) {
      setCookie(TOKEN_COOKIE_NAME, token, TOKEN_COOKIE_EXPIRES_IN_DAYS)

      // Get profile
      const profile = await mapUserToProfile(auth.currentUser)
      const profileResponse = await fetch(urls.api.v1.profile, {
        headers: { authorization: `bearer ${token}` },
      })
        .then((response) => response.json())
        .catch(() => null)

      /**
       * When an email user changes their email address,
       * we update the record in our our DB. But if the user
       * revokes the email update, it swiches back to their previous email.
       * In this event, the email in our DB is incorrect, so we update
       * it to use the Firebase email (which is the source of truth).
       * */
      if (profileResponse.email !== auth.currentUser.email) {
        await fetch(urls.api.v1.updateEmail, {
          body: JSON.stringify({ email: auth.currentUser.email }),
          headers: {
            authorization: `bearer ${token}`,
            'content-type': 'application/json',
          },
          method: 'PUT',
        })
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
        await fetch(urls.api.v1.updateLanguage, {
          body: JSON.stringify({ language: parsedLanguageCookie }),
          headers: {
            authorization: `bearer ${token}`,
            'content-type': 'application/json',
          },
          method: 'PUT',
        })
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
        await fetch(urls.api.v1.updateCurrency, {
          body: JSON.stringify({ currency: parsedCurrencyCookie }),
          headers: {
            authorization: `bearer ${token}`,
            'content-type': 'application/json',
          },
          method: 'PUT',
        })
      }

      // Set user
      dispatch(
        authActions.setUser({
          ...profile,
          username: profileResponse?.username || null,
          address: profileResponse?.address || null,
          currency: profileResponse?.currency || null,
          language: profileResponse?.language || null,
        })
      )
    }
  }, [firebaseApp])

  const getRedirectPath = useCallback(() => {
    return window.localStorage.getItem('redirect')
  }, [])

  const setRedirectPath = useCallback((urlPath: string | null) => {
    window.localStorage.setItem('redirect', urlPath ?? '')
  }, [])

  const sendNewEmailVerification = useCallback(async () => {
    const { getAuth, sendEmailVerification } = await getFirebaseAuthAsync()
    const auth = getAuth(firebaseApp)
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser)
    }
  }, [firebaseApp])

  const sendPasswordReset = useCallback(
    async (email: string) => {
      const { getAuth, sendPasswordResetEmail } = await getFirebaseAuthAsync()
      const auth = getAuth(firebaseApp)
      try {
        await sendPasswordResetEmail(auth, email)
        return { isValid: true }
      } catch {
        // For security purposes, suppress error even if user doesn't exist
        return { isValid: true }
      }
    },
    [firebaseApp]
  )

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
      const { getAuth, updateEmail, sendEmailVerification } =
        await getFirebaseAuthAsync()
      const auth = getAuth(firebaseApp)
      if (auth?.currentUser?.email) {
        try {
          // Update user's firbase account and trigger re-verification
          await updateEmail(auth.currentUser, newEmail)
          await sendEmailVerification(auth.currentUser)

          // Persist in local database
          const token = await auth.currentUser.getIdToken()
          await fetch(urls.api.v1.updateEmail, {
            body: JSON.stringify({ email: newEmail }),
            headers: {
              authorization: `bearer ${token}`,
              'content-type': 'application/json',
            },
            method: 'PUT',
          })

          await reloadProfile()
          return { isValid: true }
        } catch {
          return { isValid: false }
        }
      }
      return { isValid: false }
    },
    [firebaseApp, reloadProfile]
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
          const storageReference = ref(
            getStorage(firebaseApp),
            `/users/${auth.currentUser.uid}/${profilePic.name}`
          )
          await uploadBytes(storageReference, profilePic)
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
      email,
      password,
      passphrase,
      profilePic,
      username,
      currency,
      language,
    }: SignUpPayload) => {
      dispatch(authActions.setLoading())
      try {
        const {
          getAuth,
          createUserWithEmailAndPassword,
          sendEmailVerification,
        } = await getFirebaseAuthAsync()
        const auth = getAuth(firebaseApp)
        const { user } = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        )
        if (user) {
          // Set profile
          const token = await user.getIdToken()
          await fetch(urls.api.v1.profile, {
            body: JSON.stringify({
              email,
              passphrase,
              username,
              currency,
              language,
            }),
            headers: {
              authorization: `bearer ${token}`,
              'content-type': 'application/json',
            },
            method: 'POST',
          })

          if (profilePic) {
            await updateProfilePic(profilePic)
          }

          await sendEmailVerification(user)

          // Set method
          dispatch(authActions.setMethod('email'))
          return { isValid: true }
        }
        return { isValid: false }
      } catch (error) {
        if (error instanceof Error) {
          dispatch(authActions.setError(error.message))
        }
        return { isValid: false }
      }
    },
    [firebaseApp, updateProfilePic]
  )

  const authenticateWithEmailAndPassword = useCallback(
    async ({ email, password }: SignInPayload) => {
      dispatch(authActions.setLoading())
      try {
        const { getAuth, signInWithEmailAndPassword } =
          await getFirebaseAuthAsync()
        const auth = getAuth(firebaseApp)
        await signInWithEmailAndPassword(auth, email, password)
        dispatch(authActions.setMethod('email'))
        return { isValid: true }
      } catch (error) {
        if (error instanceof Error) {
          dispatch(authActions.setError(error.message))
        }
        return { isValid: false }
      }
    },
    [firebaseApp]
  )

  const authenticateWithGoogle = useCallback(async () => {
    dispatch(authActions.setLoading())
    const { getAuth, signInWithRedirect, GoogleAuthProvider } =
      await getFirebaseAuthAsync()
    const auth = getAuth(firebaseApp)
    await signInWithRedirect(auth, new GoogleAuthProvider())
  }, [firebaseApp])

  const signOut = useCallback(async () => {
    dispatch(authActions.setLoading())
    removeCookie(TOKEN_COOKIE_NAME)
    const { getAuth } = await getFirebaseAuthAsync()
    await getAuth(firebaseApp).signOut()
    dispatch(authActions.signOut())
  }, [firebaseApp])

  useEffect(() => {
    if (!firebaseApp) {
      return
    }

    let unsubscribe: Unsubscribe | null = null

    ;(async () => {
      const { getAuth, getRedirectResult } = await getFirebaseAuthAsync()
      const auth = getAuth(firebaseApp)
      unsubscribe = auth.onAuthStateChanged(async (user) => {
        dispatch(authActions.setLoading())
        if (user) {
          await reloadProfile()
        } else {
          dispatch(authActions.setAnonymous())
        }
      })

      getRedirectResult(auth).then(() => {
        const method =
          auth.currentUser?.providerData[0].providerId === 'password'
            ? 'email'
            : 'google'
        dispatch(authActions.setMethod(method))
        analytics.login(method)
      })
    })()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [analytics, firebaseApp, reloadProfile])

  const [state, dispatch] = useReducer(authReducer, {
    error: null,
    method: null,
    status: 'loading',
    user: null,
  })

  const value = useMemo(
    () => ({
      error: state.error,
      method: state.method,
      status: state.status,
      user: state.user,
      authenticateWithEmailAndPassword,
      authenticateWithGoogle,
      getRedirectPath,
      registerWithEmailAndPassword,
      reloadProfile,
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
      getRedirectPath,
      registerWithEmailAndPassword,
      reloadProfile,
      sendNewEmailVerification,
      sendPasswordReset,
      setRedirectPath,
      signOut,
      updateAuthSession,
      updateEmailAddress,
      updateProfilePic,
    ]
  )
  return value
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useAuthProvider()
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
