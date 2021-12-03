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

export const getPaymentNavItems = (t: Translate) => [
  {
    href: urls.checkoutMethods,
    label: t('common:nav.payment.Payment Methods'),
  },
  {
    href: urls.checkoutInformation,
    label: t('common:nav.payment.Payment Information'),
  },
  { href: urls.checkoutSummary, label: t('common:nav.payment.Summary') },
]
