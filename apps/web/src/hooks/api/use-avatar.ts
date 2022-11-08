import { UserAvatar } from '@algomart/schemas'

import { useAPI } from '@/utils/react-query'
import { urlFor, urls } from '@/utils/urls'

export const userAvatarQueryName = 'avatar'

export function useAvatar(username: string) {
  return useAPI<UserAvatar>(
    [userAvatarQueryName, username],
    urlFor(urls.api.accounts.avatarByUsername, { username })
  )
}
