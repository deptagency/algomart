import React from 'react'

import { Language } from '@/components/auth-inputs/auth-inputs'
import { useLanguage } from '@/contexts/language-context'

export default function AppFooterLanguage() {
  const { language, updateLanguage } = useLanguage()
  return (
    <Language showLabel={false} value={language} onChange={updateLanguage} />
  )
}
