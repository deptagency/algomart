import { NextApiResponse } from 'next'
import { RequestHandler } from 'next-connect'
import { Translate } from 'next-translate'
import getT from 'next-translate/getT'
import { ValidatorTest } from 'validator-fns'

import { NextApiRequestApp } from './types'

export function validateMiddleware<T>(
  requestProperty: 'body' | 'query',
  validateFactory: (t: Translate, ...rest: any[]) => ValidatorTest<T>
): RequestHandler<NextApiRequestApp<T>, NextApiResponse> {
  return async (request, response, next) => {
    const t = await getT(request.query.__nextLocale as string, 'forms')
    const validate = validateFactory(t)
    const result = await validate(request[requestProperty])
    if (result.state === 'valid') {
      request.validResult = result
      next()
    } else {
      response.status(400).json({
        statusCode: 400,
        error: `Bad Request - invalid ${requestProperty}`,
        errors: result.errors,
      })
    }
  }
}
