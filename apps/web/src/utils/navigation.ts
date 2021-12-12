import { Translate } from 'next-translate'

import { urls } from './urls'

export const getMainNavItems = (t: Translate) => [
  { href: urls.releases, label: t('common:nav.main.Releases') },
  { href: urls.myCollectibles, label: t('common:nav.main.My Collection') },
]

export const getSocialNavItems = (t: Translate) => [
  {
    href: 'https://www.facebook.com/og2dnft/',
    label: t('common:nav.social.Facebook'),
  },
  { href: 'https://twitter.com/og2d1', label: t('common:nav.social.Twitter') },
  { href: '#', label: t('common:nav.social.Discord') },
]

export const getLegalNavItems = (t: Translate) => [
  {
    href: urls.communityGuidelines,
    label: t('common:nav.legal.Community Guidelines'),
  },
  {
    href: urls.termsAndConditions,
    label: t('common:nav.legal.Terms & Conditions'),
  },
  { href: '', label: t('common:nav.legal.copyright') },
]
