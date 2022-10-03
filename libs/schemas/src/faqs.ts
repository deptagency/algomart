import { Static, Type } from '@sinclair/typebox'

import { Simplify } from './shared'

export const FaqSchema = Type.Object({
  key: Type.String(),
  question: Type.String(),
  answer: Type.String(),
})

export const FaqsSchema = Type.Object({
  faqs: Type.Array(FaqSchema),
})

export type Faq = Simplify<Static<typeof FaqSchema>>
export type Faqs = Simplify<Static<typeof FaqsSchema>>
