import AppLink, { AppLinkProps } from '@/components/app-link/app-link'
import { urlFor, urls } from '@/utils/urls'

interface UserLinkProps {
  username: string
}

export default function UserLink({
  username,
  ...appLinkProps
}: UserLinkProps & Omit<AppLinkProps, 'href'>) {
  return (
    <AppLink
      {...appLinkProps}
      href={urlFor(urls.profileShowcase, { username })}
    >
      @{username}
    </AppLink>
  )
}
