import { PublicAccount } from '@algomart/schemas'
import admin from 'firebase-admin'
import { NextApiRequest } from 'next'
import { Translate } from 'next-translate'
import { ExtractValue, ValidatorTest, ValidResult } from 'validator-fns'

export type WithValidResult<T> = {
  validResult: ValidResult<T>
}

export type WithAdminPermission = {
  isAdmin: boolean
}

export type WithToken = {
  token: admin.auth.DecodedIdToken
}

export type WithUser = {
  user: PublicAccount
}

export type NextApiRequestApp<T = unknown> = NextApiRequest &
  WithToken &
  WithUser &
  WithAdminPermission &
  WithValidResult<T>

export type ExtractBodyType<
  TValidator extends (t: Translate, ...rest: any[]) => ValidatorTest
> = Required<ExtractValue<ReturnType<TValidator>>>
