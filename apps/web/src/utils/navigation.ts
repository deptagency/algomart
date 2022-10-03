import { Translate } from 'next-translate'

import { urls } from './urls'

export const getMainNavItems = (t: Translate) => [
  { href: urls.drops, label: t('common:nav.main.Drops') },
  { href: urls.marketplace, label: t('common:nav.main.Marketplace') },
  { href: urls.myCollectibles, label: t('common:nav.main.My Collection') },
]

export const getFooterNavItems = (t: Translate) => [
  ...getMainNavItems(t),
  { href: urls.settings, label: t('common:nav.main.Settings') },
]

export const getMoreNavItems = (t: Translate) => [
  { href: urls.about, label: t('common:nav.main.About') },
  { href: urls.faqs, label: t('common:nav.main.FAQ') },
  { href: urls.support, label: t('common:nav.main.Support') },
]

export const getSocialNavItems = (t: Translate) => [
  {
    href: 'https://twitter.com/algorand',
    label: t('common:nav.social.Twitter'),
    icon: '/images/logos/twitter.svg',
  },
  {
    href: 'https://discord.gg/algorand',
    label: t('common:nav.social.Discord'),
    icon: '/images/logos/discord.svg',
  },
  {
    href: 'https://facebook.com/algorand',
    label: t('common:nav.social.Facebook'),
    icon: '/images/logos/facebook.svg',
  },
]

export const getLegalNavItems = (t: Translate) => [
  {
    href: urls.termsAndConditions,
    label: t('common:nav.legal.Terms & Conditions'),
  },
  { href: urls.privacyPolicy, label: t('common:nav.legal.Privacy Policy') },
]
