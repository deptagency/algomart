import { Translate } from 'next-translate'

import { urls } from './urls'

export const getMainNavItems = (t: Translate) => [
  { href: urls.releases, label: t('common:nav.main.Releases') },
  { href: urls.myCollectibles, label: t('common:nav.main.My Collection') },
]

export const getSocialNavItems = (t: Translate) => [
  { href: '#', label: t('common:nav.social.Instagram') },
  { href: '#', label: t('common:nav.social.Twitter') },
  { href: '#', label: t('common:nav.social.Discord') },
  { href: '#', label: t('common:nav.social.Blog') },
]

export const getLegalNavItems = (t: Translate) => [
  { href: '#', label: t('common:nav.legal.Community Guidelines') },
  { href: '#', label: t('common:nav.legal.Terms Of Service') },
  { href: '', label: t('common:nav.legal.copyright') },
]
