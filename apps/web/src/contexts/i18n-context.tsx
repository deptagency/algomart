import { I18nInfo } from '@algomart/schemas'
import {
  createContext,
  ReactNode,
  useCallback,
  useMemo,
  useReducer,
} from 'react'

import { useLocale } from '@/hooks/use-locale'
import i18nService from '@/services/i18n-service'
import { I18nState, I18nUtils } from '@/types/i18n'
import {
  ActionsUnion,
  createAction,
  createActionPayload,
} from '@/utils/reducer'

const SET_CURRENCY_CONVERSIONS = 'SET_CURRENCY_CONVERSIONS'
const SET_ERROR = 'SET_ERROR'
const SET_I18N = 'SET_I18N'
const SET_LANGUAGES = 'SET_LANGUAGES'
const SET_LOADING = 'SET_LOADING'

const i18nActions = {
  setCurrencyConversions: createActionPayload<
    typeof SET_CURRENCY_CONVERSIONS,
    I18nState['currencyConversions']
  >(SET_CURRENCY_CONVERSIONS),
  setError: createActionPayload<typeof SET_ERROR, string>(SET_ERROR),
  setI18nInfo: createActionPayload<typeof SET_I18N, I18nInfo>(SET_I18N),
  setLanguages: createActionPayload<
    typeof SET_LANGUAGES,
    I18nState['languages']
  >(SET_LANGUAGES),
  setLoading: createAction<typeof SET_LOADING>(SET_LOADING),
}

function i18nReducer(
  state: I18nState,
  action: ActionsUnion<typeof i18nActions>
): I18nState {
  switch (action.type) {
    case SET_CURRENCY_CONVERSIONS:
      return {
        ...state,
        error: null,
        currencyConversions: action.payload,
        status: 'loaded',
      }
    case SET_ERROR:
      return { ...state, error: action.payload, status: 'error' }
    case SET_I18N:
      return {
        ...state,
        error: null,
        languages: action.payload.languages,
        currencyConversions: action.payload.currencyConversions,
        status: 'loaded',
      }
    case SET_LANGUAGES:
      return { ...state, error: null, languages: action.payload }
    case SET_LOADING:
      return { ...state, error: null, status: 'loading' }
    default:
      return state
  }
}

export const I18nContext = createContext<I18nUtils | null>(null)

export function useI18nProvider() {
  const locale = useLocale()
  const [state, dispatch] = useReducer(i18nReducer, {
    currencyConversions: null,
    error: null,
    languages: null,
    status: 'loading',
  })

  const getCurrencyConversions = useCallback(async () => {
    if (state.currencyConversions) {
      return state.currencyConversions
    }

    dispatch(i18nActions.setLoading())
    try {
      const currencyConversions = await i18nService.getCurrencyConversions()
      dispatch(i18nActions.setCurrencyConversions(currencyConversions))

      return currencyConversions
    } catch (error) {
      dispatch(i18nActions.setError(error))
    }
  }, [state])

  const getI18nInfo = useCallback(async () => {
    if (state.currencyConversions && state.languages) {
      return {
        currencyConversions: state.currencyConversions,
        languages: state.languages,
      }
    }

    dispatch(i18nActions.setLoading())
    try {
      const i18nInfo = await i18nService.getI18nInfo(locale)
      dispatch(i18nActions.setI18nInfo(i18nInfo))
    } catch (error) {
      dispatch(i18nActions.setError(error))
    }
  }, [state, locale])

  const getLanguages = useCallback(async () => {
    if (state.languages) {
      return state.languages
    }

    dispatch(i18nActions.setLoading())
    try {
      const languages = await i18nService.getLanguages(locale)
      dispatch(i18nActions.setLanguages(languages))

      return languages
    } catch (error) {
      dispatch(i18nActions.setError(error))
    }
  }, [state, locale])

  const value = useMemo(
    () => ({
      currencyConversions: state.currencyConversions,
      error: state.error,
      languages: state.languages,
      status: state.status,
      getCurrencyConversions,
      getI18nInfo,
      getLanguages,
    }),
    [
      state.currencyConversions,
      state.error,
      state.languages,
      state.status,
      getCurrencyConversions,
      getI18nInfo,
      getLanguages,
    ]
  )
  return value
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const value = useI18nProvider()
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
