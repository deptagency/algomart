import cors from 'cors'
import { NextApiRequest } from 'next'
import nextConnect from 'next-connect'

import i18n from '../../i18n'

import { WithToken } from './auth-middleware'
import errorHandler from './error-handler'
import loggingMiddleware from './logging-middleware'
import notFoundHandler from './not-found-handler'
import { WithUser } from './user-middleware'
import { WithValidResult } from './validate-body-middleware'

import { loggerHttp } from '@/utils/logger'

// @ts-ignore: Translations not loading, setting this manually to avoid throwing errors.
// Note that t('some-key') will yield 'some-key' and not the translated value.
// See https://github.com/vinissimus/next-translate/issues/484 for more details.
// ...
// @TODO: Update Aug 7, 2021: Revised locale import in ./i18n.js might fix this, but need to test on Vercel.
global.i18nConfig = i18n

export type NextApiRequestApp<T = unknown> = NextApiRequest &
  WithToken &
  WithUser &
  WithValidResult<T>

export default function createHandler() {
  const handler = nextConnect({
    onError: errorHandler,
    onNoMatch: notFoundHandler,
  })

  handler.use(loggingMiddleware(loggerHttp))
  handler.use(cors())

  return handler
}
