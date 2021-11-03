import clsx from 'clsx'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback } from 'react'

import Button from '../button'

import css from './my-profile-nav.module.css'

import AppLink from '@/components/app-link/app-link'
import Select, { SelectOption } from '@/components/select/select'
import { useAuth } from '@/contexts/auth-context'
import { useRedemption } from '@/contexts/redemption-context'
import { urls } from '@/utils/urls'

interface ProfileNavProps {
  screen: 'desktop' | 'mobile'
}

export default function ProfileNav({ screen }: ProfileNavProps) {
  const auth = useAuth()
  const { pathname, push } = useRouter()
  const { setRedeemable } = useRedemption()
  const { t } = useTranslation()

  const getCurrentPage = useCallback(
    (href: string) => {
      return href === pathname || `${href}/add` === pathname
    },
    [pathname]
  )

  const handleChange = useCallback(
    (option: SelectOption) => {
      push(option.id)
    },
    [push]
  )

  const signOut = useCallback(async () => {
    await auth.signOut()
    setRedeemable(null)
    push(urls.home)
  }, [auth, push, setRedeemable])

  const navItems = [
    { id: urls.myProfile, label: t('common:pageTitles.My Profile') },
    { id: urls.myProfileSecurity, label: t('common:pageTitles.Security') },
    {
      id: urls.myProfilePaymentMethods,
      label: t('common:pageTitles.Payment Methods'),
    },
    {
      id: urls.myProfileTransactions,
      label: t('common:pageTitles.Transactions'),
    },
  ]

  return (
    <nav
      className={clsx({
        [css.isMobile]: screen === 'mobile',
        [css.isDesktop]: screen === 'desktop',
      })}
    >
      <div className={css.mobileWrapper}>
        <Select
          handleChange={handleChange}
          options={navItems}
          selectedValue={navItems.find(({ id }) => getCurrentPage(id))}
        />
      </div>
      <div className={css.desktopWrapper}>
        <ul className={css.listWrapper}>
          {navItems.map(({ id, label }) => {
            return (
              <li
                className={clsx(css.listItem, {
                  [css.listItemActive]:
                    id === pathname || `${id}/add` === pathname,
                })}
                key={id}
              >
                <AppLink href={id}>{label}</AppLink>
              </li>
            )
          })}
        </ul>
        <Button fullWidth onClick={signOut} size="small">
          {t('common:actions.Sign Out')}
        </Button>
      </div>
    </nav>
  )
}
