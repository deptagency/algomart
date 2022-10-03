import cors from 'cors'
import nextConnect from 'next-connect'
import pinoHttp from 'pino-http'

import i18n from '../../i18n'

import { errorHandler } from './error-handler'
import { loggingMiddleware } from './logging-middleware'
import { notFoundHandler } from './not-found-handler'

import { AppConfig } from '@/config'
import { createLogger } from '@/utils/logger'

// @ts-ignore: Translations not loading, setting this manually to avoid throwing errors.
// Note that t('some-key') will yield 'some-key' and not the translated value.
// See https://github.com/vinissimus/next-translate/issues/484 for more details.
// ...
// @TODO: Update Aug 7, 2021: Revised locale import in ./i18n.js might fix this, but need to test on Vercel.
global.i18nConfig = i18n

export * from './admin-middleware'
export * from './auth-middleware'
export * from './logging-middleware'
export * from './types'
export * from './user-middleware'
export * from './validate-middleware'
export * from './validate-schema-middleware'

export default function createHandler() {
  const handler = nextConnect({
    onError: errorHandler,
    onNoMatch: notFoundHandler,
  })

  handler.use(
    loggingMiddleware(
      pinoHttp({
        logger: createLogger(AppConfig.logLevel),
        redact: {
          paths: ['req.headers', 'res.headers'],
          remove: true,
        },
      })
    )
  )
  handler.use(cors())

  return handler
}
