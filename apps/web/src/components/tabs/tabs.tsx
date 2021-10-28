import clsx from 'clsx'

import css from './tabs.module.css'

import AppLink from '@/components/app-link/app-link'

interface TabProps {
  href: string
  label: string
}

export interface TabsProps {
  activeTab: number
  tabs: TabProps[]
}

export default function Tabs({ activeTab, tabs }: TabsProps) {
  return (
    <div className={css.root}>
      <div className={css.tabsContainer}>
        {tabs.map(({ href, label }, index) => (
          <AppLink
            className={clsx(css.tab, { [css.tabActive]: activeTab === index })}
            href={href}
            key={label}
          >
            {label}
          </AppLink>
        ))}
      </div>
    </div>
  )
}
