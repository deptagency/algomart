import { Language } from '@/components/auth-inputs/auth-inputs'
import { useLanguage } from '@/contexts/language-context'

export default function AppFooterLanguage() {
  const { language, updateLanguage } = useLanguage()
  return (
    <Language
      noMargin
      label=""
      value={language}
      onChange={updateLanguage}
      density="compact"
      variant="outline"
    />
  )
}
