import clsx from 'clsx'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback } from 'react'

import css from './my-profile-nav.module.css'

import AppLink from '@/components/app-link/app-link'
import Button from '@/components/button'
import Select, { SelectOption } from '@/components/select'
import { useAuth } from '@/contexts/auth-context'
import { useRedemption } from '@/contexts/redemption-context'
import { urls } from '@/utils/urls'

const LOG_OUT = 'LOG_OUT'

interface ProfileNavProps {
  screen: 'desktop' | 'mobile'
}

export default function ProfileNav({ screen }: ProfileNavProps) {
  const auth = useAuth()
  const { pathname, push } = useRouter()
  const { setRedeemable } = useRedemption()
  const { t } = useTranslation()

  const signOut = useCallback(async () => {
    await auth.signOut()
    setRedeemable(null)
    push(urls.home)
  }, [auth, push, setRedeemable])

  const handleChange = useCallback(
    (value) => {
      if (value === LOG_OUT) {
        signOut()
      } else {
        push(value)
      }
    },
    [push, signOut]
  )

  const navItems = [
    { value: urls.myProfile, label: t('common:pageTitles.My Profile') },
    { value: urls.myProfileSecurity, label: t('common:pageTitles.Security') },
    {
      value: urls.myProfilePaymentMethods,
      label: t('common:pageTitles.Payment Methods'),
    },
    {
      value: urls.myVerification,
      label: t('common:pageTitles.My Verification'),
    },
    // Might be useful later
    // {
    //   value: urls.myProfileImportNFT,
    //   label: t('common:pageTitles.Import NFT'),
    // },
  ] as SelectOption[]

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
              value: LOG_OUT,
              label: t('common:actions.Sign Out'),
            },
          ]}
          value={pathname.replace(/\/add$/, '')}
        />
      </div>
      <div className={css.desktopWrapper}>
        <ul className={css.listWrapper}>
          {navItems.map(({ value, label }) => (
            <li
              className={clsx(css.listItem, {
                [css.listItemActive]:
                  value === pathname || `${value}/add` === pathname,
              })}
              key={value}
            >
              <AppLink href={value}>{label}</AppLink>
            </li>
          ))}
        </ul>
        <div className="px-5 pt-3">
          <Button fullWidth variant="outline" onClick={signOut}>
            {t('common:actions.Sign Out')}
          </Button>
        </div>
      </div>
    </nav>
  )
}
