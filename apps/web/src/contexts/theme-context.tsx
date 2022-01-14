import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import { DEFAULT_THEME } from '@/themes'
import { applyTheme, getThemeFromBrowser } from '@/themes/utils'

interface IThemeContext {
  theme?: string
  toggleTheme: () => void
  setTheme: (theme?: string) => void
}

export const ThemeContext = createContext<IThemeContext>({
  theme: DEFAULT_THEME,
  setTheme: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
  toggleTheme: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
})

export const useThemeContext = () => useContext(ThemeContext)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<string | undefined>(DEFAULT_THEME)

  const toggleTheme = () => {
    setTheme((theme) => (theme === 'dark' ? 'light' : 'dark'))
  }

  const handleThemeChangeShortcut = useCallback((event: KeyboardEvent) => {
    if (event.ctrlKey && event.key === 'l') {
      console.log('toggle theme')
      toggleTheme()
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keypress', handleThemeChangeShortcut)
    setTheme(getThemeFromBrowser())
    return () => {
      document.removeEventListener('keypress', handleThemeChangeShortcut)
    }
  }, [handleThemeChangeShortcut])

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    if (theme) {
      localStorage.setItem('theme', theme)
      applyTheme(theme)
    } else {
      // use OS theme
      localStorage.removeItem('theme')
      applyTheme(getThemeFromBrowser())
    }
  }, [theme])

  const value = {
    theme,
    setTheme,
    toggleTheme,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
