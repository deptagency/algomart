import Ajv, { SchemaObject } from 'ajv'
import addFormats from 'ajv-formats'
import { NextApiResponse } from 'next'
import { RequestHandler } from 'next-connect'

import { NextApiRequestApp } from './types'

const ajv = new Ajv({
  strict: false,
  coerceTypes: 'array',
})
addFormats(ajv)

export function validateSchemaMiddleware(
  requestProperty: 'body' | 'query',
  schemaOrValidator: SchemaObject
): RequestHandler<NextApiRequestApp, NextApiResponse> {
  const validate = ajv.compile(schemaOrValidator)
  return async (request, response, next) => {
    let isValid = true

    switch (requestProperty) {
      case 'body':
        isValid = validate(request.body)
        break

      case 'query':
        isValid = validate(request.query)
        break
    }

    if (!isValid) {
      return response.status(400).json({
        statusCode: 400,
        error: `Bad Request - invalid ${requestProperty}`,
        errors: validate.errors,
      })
    }

    next()
  }
}
