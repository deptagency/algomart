import { Translate } from 'next-translate'
import { number, object, required, string } from 'validator-fns'

// Fields
const validateAmount = (t: Translate) =>
  number(required(t('forms:errors.required') as string))

const validatePackId = (t: Translate) =>
  string(required(t('forms:errors.required') as string))

// Forms
export const validateBidForPack = (t: Translate) =>
  object({
    amount: validateAmount(t),
    packId: validatePackId(t),
  })
