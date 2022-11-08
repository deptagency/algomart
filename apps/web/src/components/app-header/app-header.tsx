import { MenuIcon, UserCircleIcon, XIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import UserMenu from './user-menu'

import css from './app-header.module.css'

import AppLink from '@/components/app-link/app-link'
import { Language } from '@/components/auth-inputs/auth-inputs'
import Button from '@/components/button'
import Credits from '@/components/currency/credits'
import Logo from '@/components/logo/logo'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { getMainNavItems } from '@/utils/navigation'
import { getPrefixPath, isSubPath, urls } from '@/utils/urls'

const MainMenuNavItems = ({
  hideMobileMenu,
  mobile,
}: {
  hideMobileMenu: () => void
  mobile?: boolean
}) => {
  const { t } = useTranslation()
  const navItems = getMainNavItems(t)
  const { asPath } = useRouter()

  return (
    <>
      {navItems.map(({ href, label }) => {
        return (
          <li key={href}>
            <AppLink
              className={clsx(css.mainNavLink, {
                [css.mainNavLinkActive]: isSubPath(
                  asPath,
                  getPrefixPath(href),
                  ['profile', 'wallet', 'verification']
                ),
              })}
              href={href}
              onClick={hideMobileMenu}
              data-e2e={`${mobile ? 'mobile' : 'main'}-nav-${label}-link`}
            >
              {label}
            </AppLink>
          </li>
        )
      })}
    </>
  )
}

const AccountActions = ({ hideMobileMenu }: { hideMobileMenu: () => void }) => {
  const auth = useAuth()
  const { language, updateLanguage } = useLanguage()
  const { t } = useTranslation()
  const { push } = useRouter()
  const isAuthenticated = auth.status === 'authenticated'
  const signUp = () => {
    hideMobileMenu()
    push(urls.signUpEmail)
  }

  return (
    <>
      <Language
        className={css.languageSelect}
        noMargin
        onChange={updateLanguage}
        label=""
        value={language}
        density="compact"
        variant="outline"
      />

      {isAuthenticated ? (
        <UserMenu />
      ) : (
        <>
          <AppLink
            data-e2e="main-nav-signin-link"
            className={css.accountActionsLink}
            href={urls.login}
          >
            <span className="hidden md:inline">
              {t('common:actions.Sign In')}
            </span>
            <UserCircleIcon
              className={css.avatarGeneric}
              height={40}
              width={40}
            />
          </AppLink>
          <Button
            data-e2e="main-nav-join-now-link"
            className={css.createAccountButton}
            onClick={signUp}
          >
            {t('common:actions.Join Now')}
          </Button>
        </>
      )}
    </>
  )
}

export default function AppHeader() {
  const auth = useAuth()
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false)
  const { t } = useTranslation()
  const { push } = useRouter()
  const isAuthenticated = auth.status === 'authenticated'

  const signOut = useCallback(async () => {
    await auth.signOut()
    push(urls.home)
  }, [auth, push])

  return (
    <header
      className={clsx(css.root, {
        [css.rootMobileVisible]: showMobileMenu,
      })}
    >
      <div className={css.header}>
        <div className={css.headerWrapper}>
          <div className={css.hamburgerWrapper}>
            <button
              className={css.burger}
              onClick={() => {
                setShowMobileMenu(!showMobileMenu)
              }}
            >
              {showMobileMenu ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
          <div className={css.mainNavWrapper}>
            <div className={css.logo}>
              <Logo />
            </div>
            <nav
              aria-label={t('common:nav.aria.Main Navigation')}
              className={css.mainNav}
            >
              <ul className={css.mainNavItems}>
                <MainMenuNavItems
                  hideMobileMenu={() => setShowMobileMenu(false)}
                />
              </ul>
            </nav>
          </div>
          <div className={css.accountActions}>
            {auth.status !== 'loading' && (
              <AccountActions hideMobileMenu={() => setShowMobileMenu(false)} />
            )}
          </div>
        </div>
      </div>

      <div className={css.mobileNav}>
        <dl className={css.creditsBox}>
          <dd className={css.creditsValue}>
            <Credits value={auth?.user?.balance ?? 0} />
          </dd>
          <dt>{t('common:global.Balance')}</dt>
        </dl>
        <ul className={css.mobileNavItems}>
          <MainMenuNavItems
            hideMobileMenu={() => setShowMobileMenu(false)}
            mobile={true}
          />
        </ul>
        {isAuthenticated ? (
          <div className={css.mobileUtilityLinks}>
            <AppLink href={urls.settings}>
              {t('common:nav.main.Settings')}
            </AppLink>
            <Button variant="link" onClick={signOut}>
              {t('common:actions.Sign out')}
            </Button>
          </div>
        ) : (
          <div className={css.mobileUtilityLinks}>
            <AppLink href={urls.signUpEmail}>
              {t('common:actions.Join Now')}
            </AppLink>
            <AppLink href={urls.loginEmail}>
              {t('common:actions.Sign In')}
            </AppLink>
          </div>
        )}
      </div>
    </header>
  )
}
