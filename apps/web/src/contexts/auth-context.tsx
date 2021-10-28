import {
  Auth,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithRedirect,
  updateEmail,
  updateProfile,
} from 'firebase/auth'
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react'

import { Analytics } from '@/clients/firebase-analytics'
import loadFirebase from '@/clients/firebase-client'
import {
  AuthState,
  AuthUtils,
  Profile,
  SignInPayload,
  SignUpPayload,
} from '@/types/auth'
import { FileWithPreview } from '@/types/file'
import { removeCookie, setCookie } from '@/utils/cookies-web'
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
    email: user.email,
    emailVerified: user.emailVerified,
    name: user.displayName,
    photo: user.photoURL,
    token: await user.getIdToken(),
    uid: user.uid,
    username: null,
  }
}

export const AuthContext = createContext<AuthUtils | null>(null)

export function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) {
    throw new Error('AuthProvider missing')
  }
  return auth
}

export function useAuthProvider() {
  const reloadProfile = useCallback(async () => {
    const auth = getAuth(loadFirebase())
    const token = await auth.currentUser?.getIdToken()
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

      // Set user
      dispatch(
        authActions.setUser({
          ...profile,
          username: profileResponse?.username || null,
          address: profileResponse?.address || null,
        })
      )
    }
  }, [])

  const getRedirectPath = useCallback(() => {
    return window.localStorage.getItem('redirect')
  }, [])

  const setRedirectPath = useCallback((urlPath: string | null) => {
    window.localStorage.setItem('redirect', urlPath ?? '')
  }, [])

  const sendNewEmailVerification = useCallback(async () => {
    const auth = getAuth(loadFirebase())
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser)
    }
  }, [])

  const sendPasswordReset = useCallback(async (email: string) => {
    const auth = getAuth(loadFirebase())
    try {
      await sendPasswordResetEmail(auth, email)
      return { isValid: true }
    } catch {
      // For security purposes, suppress error even if user doesn't exist
      return { isValid: true }
    }
  }, [])

  const updateAuthSession = useCallback(async (password: string) => {
    const auth = getAuth(loadFirebase())
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
  }, [])

  const updateEmailAddress = useCallback(
    async (newEmail: string) => {
      const auth = getAuth(loadFirebase())
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
    [reloadProfile]
  )

  const updateProfilePic = useCallback(
    async (profilePic: FileWithPreview | null) => {
      const auth = getAuth(loadFirebase())
      if (auth.currentUser) {
        let photoURL = ''
        if (profilePic) {
          const storageReference = ref(
            getStorage(loadFirebase()),
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
    [reloadProfile]
  )

  const registerWithEmailAndPassword = useCallback(
    async ({
      email,
      password,
      passphrase,
      profilePic,
      username,
    }: SignUpPayload) => {
      dispatch(authActions.setLoading())
      try {
        const auth = getAuth(loadFirebase())
        const { user } = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        )
        if (user) {
          // Set profile
          const token = await user.getIdToken()
          await fetch(urls.api.v1.profile, {
            body: JSON.stringify({ email, passphrase, username }),
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
    [updateProfilePic]
  )

  const authenticateWithEmailAndPassword = useCallback(
    async ({ email, password }: SignInPayload) => {
      dispatch(authActions.setLoading())
      try {
        const auth = getAuth(loadFirebase())
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
    []
  )

  const authenticateWithGoogle = useCallback(async () => {
    dispatch(authActions.setLoading())
    const auth = getAuth(loadFirebase())
    await signInWithRedirect(auth, new GoogleAuthProvider())
  }, [])

  const signOut = useCallback(async () => {
    dispatch(authActions.setLoading())
    removeCookie(TOKEN_COOKIE_NAME)
    await getAuth(loadFirebase()).signOut()
    dispatch(authActions.signOut())
  }, [])

  useEffect(() => {
    const auth = getAuth(loadFirebase())
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
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
      Analytics.instance.login(method)
    })
    return () => {
      unsubscribe()
    }
  }, []) /* eslint-disable-line react-hooks/exhaustive-deps */

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
