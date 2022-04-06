import clsx from 'clsx'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback } from 'react'

import Button from '../button'

import css from './my-profile-nav.module.css'

import AppLink from '@/components/app-link/app-link'
import Select, { SelectOption } from '@/components/select-input/select-input'
import { useAuth } from '@/contexts/auth-context'
import { useRedemption } from '@/contexts/redemption-context'
import useAdmin from '@/hooks/use-admin'
import { urls } from '@/utils/urls'

const LOG_OUT = 'LOG_OUT'

interface ProfileNavProps {
  screen: 'desktop' | 'mobile'
}

export default function ProfileNav({ screen }: ProfileNavProps) {
  const auth = useAuth()
  const { isAdmin } = useAdmin()
  const { pathname, push } = useRouter()
  const { setRedeemable } = useRedemption()
  const { t } = useTranslation()

  const handleChange = useCallback(
    (value) => {
      if (value === LOG_OUT) {
        signOut()
      } else {
        push(value)
      }
    },
    [push]
  )

  const signOut = useCallback(async () => {
    await auth.signOut()
    setRedeemable(null)
    push(urls.home)
  }, [auth, push, setRedeemable])

  const navItems = [
    { key: urls.myProfile, label: t('common:pageTitles.My Profile') },
    { key: urls.myProfileSecurity, label: t('common:pageTitles.Security') },
    {
      key: urls.myProfilePaymentMethods,
      label: t('common:pageTitles.Payment Methods'),
    },
    {
      key: urls.myProfileTransactions,
      label: t('common:pageTitles.Transactions'),
    },
    {
      key: urls.myProfileImportNFT,
      label: t('common:pageTitles.Import NFT'),
    },
  ] as SelectOption[]

  if (isAdmin) {
    navItems.push({
      key: urls.admin.index,
      label: t('common:pageTitles.Admin'),
    })
  }

  return (
    <nav
      className={clsx({
        [css.isMobile]: screen === 'mobile',
        [css.isDesktop]: screen === 'desktop',
      })}
    >
      <div className={css.mobileWrapper}>
        <Select
          onChange={handleChange}
          options={[
            ...navItems,
            {
              key: LOG_OUT,
              label: t('common:actions.Sign Out'),
            },
          ]}
          value={pathname.replace(/\/add$/, '')}
        />
      </div>
      <div className={css.desktopWrapper}>
        <ul className={css.listWrapper}>
          {navItems.map(({ key, label }) => (
            <li
              className={clsx(css.listItem, {
                [css.listItemActive]:
                  key === pathname || `${key}/add` === pathname,
              })}
              key={key}
            >
              <AppLink href={key}>{label}</AppLink>
            </li>
          ))}
        </ul>
        <Button fullWidth onClick={signOut} size="small">
          {t('common:actions.Sign Out')}
        </Button>
      </div>
    </nav>
  )
}
