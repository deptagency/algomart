import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react'

// @TODO: define notification type
type Notification = unknown

export interface NotificationState {
  notifications: Notification[]
  addNotification: (notification: Notification) => void
  removeNotification: (notification: Notification) => void
}

export const NotificationContext = createContext<NotificationState | null>(null)

export interface NotificationProviderProps {
  children: ReactNode
}

export function useNotificationProvider() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Notification) => {
    setNotifications((notifications) => [...notifications, notification])
  }, [])

  const removeNotification = useCallback((notification: Notification) => {
    setNotifications((notifications) =>
      notifications.filter((n) => n !== notification)
    )
  }, [])

  return {
    notifications,
    addNotification,
    removeNotification,
  }
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (context === null) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    )
  }
  return context
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const value = useNotificationProvider()

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
