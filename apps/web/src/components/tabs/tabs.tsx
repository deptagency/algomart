import clsx from 'clsx'

import css from './tabs.module.css'

import AppLink from '@/components/app-link/app-link'

interface ILink {
  label: string
  href: string
}
interface IToggle {
  component: React.ReactNode
  onClick: () => void
}

export interface TabsProps {
  activeTab?: number
  tabs: ILink[] | IToggle[]
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
        {tabs.map((tab, index) => {
          return tab.label && tab.href ? (
            <AppLink
              className={clsx(css.tab, css.tabWide, {
                [css.tabActive]: activeTab === index,
              })}
              href={tab.href}
              key={tab.label}
              scroll={scroll}
            >
              {tab.label}
            </AppLink>
          ) : (
            <button
              className={clsx(css.tab, {
                [css.tabActive]: activeTab === index,
              })}
              key={`toggle-tab-${index}`}
              onClick={tab.onClick}
            >
              {tab.component}
            </button>
          )
        })}
      </div>
    </div>
  )
}
