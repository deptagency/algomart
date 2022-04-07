import clsx from 'clsx'

import css from './tabs.module.css'

import AppLink from '@/components/app-link/app-link'

export interface ITabItem {
  href: string
  label: string
}

export interface TabsProps {
  activeTab?: number
  tabs: ITabItem[]
  variant?: 'responsive' | 'fullWidth'
  className?: string
  scroll?: boolean
}

export default function Tabs({
  activeTab,
  tabs,
  className,
  variant = 'responsive',
  scroll,
}: TabsProps) {
  return (
    <div
      className={clsx(css.root, className, {
        [css.responsive]: variant === 'responsive',
      })}
    >
      <div className={css.tabsContainer}>
        {tabs.map(({ href, label }, index) => (
          <AppLink
            className={clsx(css.tab, {
              [css.tabActive]: activeTab === index,
            })}
            href={href}
            key={label}
            scroll={scroll}
          >
            {label}
          </AppLink>
        ))}
      </div>
    </div>
  )
}
