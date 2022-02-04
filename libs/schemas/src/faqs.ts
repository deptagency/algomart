import { Static, Type } from '@sinclair/typebox'

import { Simplify } from './shared'

export const FaqsSchema = Type.Object({
  faqs: Type.Array(
    Type.Object({
      question: Type.String(),
      answer: Type.String(),
    })
  ),
})

export type Faqs = Simplify<Static<typeof FaqsSchema>>
