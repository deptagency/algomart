import { ChevronDownIcon, UserCircleIcon } from '@heroicons/react/outline'
import { XCircleIcon } from '@heroicons/react/solid'
import clsx from 'clsx'
import Image from 'next/image'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { KeyboardEvent, useCallback, useEffect, useState } from 'react'

import PendingCredits from '../currency/pending-credits'

import headerCss from './app-header.module.css'
import css from './user-menu.module.css'

import AppLink from '@/components/app-link/app-link'
import Button from '@/components/button'
import Credits from '@/components/currency/credits'
import { Popover } from '@/components/popover'
import { useAuth } from '@/contexts/auth-context'
import { urls } from '@/utils/urls'

export default function UserMenu() {
  const [nav, setNav] = useState<HTMLElement>()
  const auth = useAuth()
  const { t } = useTranslation()
  const router = useRouter()

  const signOut = useCallback(async () => {
    await auth.signOut()
    router.push(urls.home)
  }, [auth, router.push]) // eslint-disable-line react-hooks/exhaustive-deps

  const [isOpen, setIsOpen] = useState(false)

  const handleToggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.code == 'Escape') {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    if (nav) {
      nav.focus()
    }
  }, [nav])

  const userMenu = (
    <nav
      className={clsx(css.userMenu)}
      data-e2e="user-menu"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
      role="menu"
      ref={setNav}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <dl className={css.credits}>
        <dd className={css.creditsValue}>
          <Credits value={auth?.user?.balance ?? 0} />
        </dd>
      </dl>
      <PendingCredits />
      <ul className={clsx(css.menuItemList)}>
        <li className={css.userMenuItem}>
          <AppLink
            data-e2e="user-menu-my-wallet"
            role="menuitem"
            href={urls.myWallet}
          >
            {t('common:global.My Wallet')}
          </AppLink>
        </li>
        <li className={css.userMenuItem}>
          <AppLink role="menuitem" href={urls.myCollectibles}>
            {t('common:nav.main.My Collection')}
          </AppLink>
        </li>
        <li className={css.userMenuItem}>
          <AppLink
            data-e2e="user-menu-my-profile"
            role="menuitem"
            href={urls.myProfile}
          >
            {t('common:pageTitles.My Profile')}
          </AppLink>
        </li>
        <li className={css.userMenuItem}>
          <Button data-e2e="nav-menu-sign-out" fullWidth onClick={signOut}>
            {t('common:actions.Sign Out')}
          </Button>
        </li>
      </ul>
    </nav>
  )

  return (
    <span className={headerCss.accountActionsLink}>
      <Popover
        noPad
        isOpen={isOpen}
        content={userMenu}
        positions={['bottom', 'left']}
        padding={12}
        boundaryInset={16}
        onClickOutside={() => setIsOpen(false)}
      >
        <button
          className={clsx(css.userMenuButton, {
            [css.isOpen]: isOpen,
          })}
          aria-haspopup="menu"
          aria-expanded={Boolean(isOpen)}
          onClick={handleToggleMenu}
          data-e2e="nav-menu-open-button"
        >
          {auth.user?.photo ? (
            <div className={css.userAvatar}>
              <Image
                alt={t('common:nav.utility.My profile picture')}
                src={auth.user.photo}
                layout="intrinsic"
                height={36}
                width={36}
                priority={true}
                className="object-cover"
              />
            </div>
          ) : (
            <UserCircleIcon className={css.genericAvatar} />
          )}
          <div className={css.userMenuButtonLabel}>
            {auth.user.username || t('common:nav.utility.My Account')}
          </div>
          <ChevronDownIcon
            width={16}
            className={css.userMenuChevron}
            strokeWidth="2.5"
          />
          <XCircleIcon width={16} className={css.userMenuClose} />
        </button>
      </Popover>
    </span>
  )
}
