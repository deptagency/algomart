import clsx from 'clsx'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'

import css from './social-media-icons.module.css'

import ExternalLink from '@/components/external-link'
import { getSocialNavItems } from '@/utils/navigation'

interface SocialMediaIcons {
  className?: string
}

export function SocialMediaIcons({ className }: SocialMediaIcons) {
  const { t } = useTranslation()

  return (
    <div className={clsx(css.socialMediaIconsWrapper, className)}>
      <nav className={css.socialMediaIcons}>
        {getSocialNavItems(t).map(({ href, label, icon }) => (
          <ExternalLink key={label} href={href}>
            <Image width={32} height={32} src={icon} alt={label} />
          </ExternalLink>
        ))}
      </nav>
    </div>
  )
}
