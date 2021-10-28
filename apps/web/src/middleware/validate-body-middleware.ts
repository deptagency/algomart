import { NextApiRequest, NextApiResponse } from 'next'
import { RequestHandler } from 'next-connect'
import { Translate } from 'next-translate'
import getT from 'next-translate/getT'
import { ExtractValue, ValidatorTest, ValidResult } from 'validator-fns'

export type WithValidResult<T> = {
  validResult: ValidResult<T>
}

export type ExtractBodyType<
  TValidator extends (t: Translate) => ValidatorTest
> = Required<ExtractValue<ReturnType<TValidator>>>

export default function validateBodyMiddleware<T>(
  validateFactory: (t: Translate) => ValidatorTest<T>
): RequestHandler<NextApiRequest & WithValidResult<T>, NextApiResponse> {
  return async (request, response, next) => {
    const t = await getT(request.query.__nextLocale as string, 'forms')
    const validate = validateFactory(t)
    const result = await validate(request.body)
    if (result.state === 'valid') {
      request.validResult = result
      next()
    } else {
      response.status(400).json({
        statusCode: 400,
        error: 'Bad Request',
        message: result.message,
        errors: result.errors,
      })
    }
  }
}
