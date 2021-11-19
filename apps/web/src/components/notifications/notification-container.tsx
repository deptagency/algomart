import Notification from './notification'

import css from './notification-container.module.css'

import { useNotification } from '@/contexts/notification-context'

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotification()

  return (
    <div aria-live="assertive" className={css.root}>
      <div className={css.content}>
        {notifications.map((notification, index) => (
          <Notification
            key={index}
            show
            onClose={() => removeNotification(notification)}
          />
        ))}
      </div>
    </div>
  )
}
