import { Translate } from 'next-translate'

import { urls } from './urls'

export const getMainNavItems = (t: Translate) => [
  { href: urls.home, label: t('common:nav.main.Home') },
  { href: urls.releases, label: t('common:nav.main.Releases') },
  { href: urls.teams, label: t('common:nav.main.Teams') },
  { href: urls.myCollectibles, label: t('common:nav.main.My Collection') },
  { href: urls.settings, label: t('common:nav.main.Settings') },
]

export const getMoreNavItems = (t: Translate) => [
  { href: urls.about, label: t('common:nav.main.About FIFA NFTs') },
  { href: urls.faqs, label: t('common:nav.main.FAQ') },
  { href: urls.support, label: t('common:nav.main.Support') },
]

export const getSocialNavItems = (t: Translate) => [
  {
    href: '#',
    label: t('common:nav.social.Instagram'),
    icon: '/images/logos/instagram.svg',
  },
  {
    href: '#',
    label: t('common:nav.social.Twitter'),
    icon: '/images/logos/twitter.svg',
  },
  {
    href: '#',
    label: t('common:nav.social.Facebook'),
    icon: '/images/logos/facebook.svg',
  },
  {
    href: '#',
    label: t('common:nav.social.YouTube'),
    icon: '/images/logos/youtube.svg',
  },
  {
    href: '#',
    label: t('common:nav.social.Weibo'),
    icon: '/images/logos/weibo.svg',
  },
]

export const getLegalNavItems = (t: Translate) => [
  {
    href: urls.termsAndConditions,
    label: t('common:nav.legal.Terms & Conditions'),
  },
  {
    href: urls.dataProtectionPortal,
    label: t('common:nav.legal.Data Protection Portal'),
  },
  { href: urls.downloads, label: t('common:nav.legal.Downloads') },
]
