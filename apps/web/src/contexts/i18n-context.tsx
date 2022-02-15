/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react-hooks/exhaustive-deps */
import {
  CurrencyConversionDict,
  I18nInfo,
  LanguageList,
} from '@algomart/schemas'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react'

import { useCurrency } from '@/hooks/use-currency'
import { useLocale } from '@/hooks/use-locale'
import i18nService from '@/services/i18n-service'
import { I18nState, I18nUtils } from '@/types/i18n'
import {
  ActionsUnion,
  createAction,
  createActionPayload,
} from '@/utils/reducer'

const SET_CONVERSION_RATE = 'SET_CONVERSION_RATE'
const SET_CURRENCY_CONVERSIONS = 'SET_CURRENCY_CONVERSIONS'
const SET_ERROR = 'SET_ERROR'
const SET_I18N = 'SET_I18N'
const SET_LANGUAGES = 'SET_LANGUAGES'
const SET_LOADING = 'SET_LOADING'

const i18nActions = {
  setConversionRate: createActionPayload<typeof SET_CONVERSION_RATE, number>(
    SET_CONVERSION_RATE
  ),
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
    case SET_CONVERSION_RATE:
      return { ...state, error: null, conversionRate: action.payload }
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

export function useI18n() {
  const i18n = useContext(I18nContext)
  if (!i18n) {
    throw new Error('AuthProvider missing')
  }
  return i18n
}

export function useI18nProvider() {
  const locale = useLocale()
  const currency = useCurrency()

  const getCurrencyConversions =
    useCallback(async (): Promise<CurrencyConversionDict> => {
      try {
        dispatch(i18nActions.setLoading())

        const currencyConversions = await i18nService.getCurrencyConversions()
        dispatch(i18nActions.setCurrencyConversions(currencyConversions))

        return currencyConversions
      } catch (error) {
        dispatch(i18nActions.setError(error))
      }
    }, [])

  const getI18nInfo = useCallback(async (): Promise<I18nInfo> => {
    try {
      dispatch(i18nActions.setLoading())

      const i18nInfo = await i18nService.getI18nInfo(locale)
      dispatch(i18nActions.setI18nInfo(i18nInfo))

      return i18nInfo
    } catch (error) {
      dispatch(i18nActions.setError(error))
    }
  }, [locale])

  const getLanguages = useCallback(async (): Promise<LanguageList> => {
    try {
      dispatch(i18nActions.setLoading())

      const languages = await i18nService.getLanguages(locale)
      dispatch(i18nActions.setLanguages(languages))

      return languages
    } catch (error) {
      dispatch(i18nActions.setError(error))
    }
  }, [locale])

  useEffect(() => {
    const run = async () => {
      const { currencyConversions } = await getI18nInfo()
      dispatch(i18nActions.setConversionRate(currencyConversions[currency]))
    }

    run()
  }, [currency])

  const [state, dispatch] = useReducer(i18nReducer, {
    conversionRate: 1,
    currencyConversions: null,
    error: null,
    languages: null,
    status: 'not-loaded',
  })

  const value = useMemo(
    () => ({
      conversionRate: state.conversionRate,
      currencyConversions: state.currencyConversions,
      error: state.error,
      languages: state.languages,
      status: state.status,
      getCurrencyConversions,
      getI18nInfo,
      getLanguages,
    }),
    [
      state.conversionRate,
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
