import useTranslation from 'next-translate/useTranslation'

import common from './my-profile-common.module.css'

import Heading from '@/components/heading'
import Select, { SelectOption } from '@/components/select-input/select-input'
import { useThemeContext } from '@/contexts/theme-context'

const OS_THEME = 'OS'

const THEME_OPTIONS: SelectOption[] = [
  {
    label: (
      <span>
        <span aria-hidden="true">🌑 </span>Dark
      </span>
    ),
    key: 'dark',
  },
  {
    label: (
      <span>
        <span aria-hidden="true">🌕 </span>Light
      </span>
    ),
    key: 'light',
  },
  {
    label: (
      <span>
        <span aria-hidden="true">🌗 </span>OS Theme
      </span>
    ),
    key: OS_THEME,
  },
]

export default function MyProfileCurrency() {
  const { theme, setTheme } = useThemeContext()
  const { t } = useTranslation()

  return (
    <section className={common.section}>
      <div className={common.sectionHeader}>
        <Heading className={common.sectionHeading} level={2}>
          {t('common:global.Theme')}
        </Heading>
      </div>
      <div className={common.sectionContent}>
        <Select
          value={theme ? theme : OS_THEME}
          options={THEME_OPTIONS}
          onChange={(theme) => setTheme(theme === OS_THEME ? null : theme)}
        />
      </div>
    </section>
  )
}
