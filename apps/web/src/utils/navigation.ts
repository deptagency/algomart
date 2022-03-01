import { Translate } from 'next-translate'

import { urls } from './urls'

export const getMainNavItems = (t: Translate) => [
  { href: urls.home, label: t('common:nav.main.Home') },
  { href: urls.releases, label: t('common:nav.main.Releases') },
  { href: urls.myCollectibles, label: t('common:nav.main.My Collection') },
]

export const getFooterNavItems = (t: Translate) => [
  ...getMainNavItems(t),
  { href: urls.settings, label: t('common:nav.main.Settings') },
]

export const getMoreNavItems = (t: Translate) => [
  { href: urls.about, label: t('common:nav.main.About FIFA NFTs') },
  { href: urls.faqs, label: t('common:nav.main.FAQ') },
  { href: urls.support, label: t('common:nav.main.Support') },
]

export const getSocialNavItems = (t: Translate) => [
  {
    href: 'https://instagram.com/fifaworldcup',
    label: t('common:nav.social.Instagram'),
    icon: '/images/logos/instagram.svg',
  },
  {
    href: 'https://twitter.com/FIFAcom',
    label: t('common:nav.social.Twitter'),
    icon: '/images/logos/twitter.svg',
  },
  {
    href: 'https://www.facebook.com/fifa',
    label: t('common:nav.social.Facebook'),
    icon: '/images/logos/facebook.svg',
  },
  {
    href: 'https://www.youtube.com/FIFATV',
    label: t('common:nav.social.YouTube'),
    icon: '/images/logos/youtube.svg',
  },
  {
    href: 'https://www.weibo.com/FIFAWorldCup?is_hot=1',
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
