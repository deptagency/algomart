import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import { Environment } from '@/environment'

/** Returns the theme set in localStorage, else the OS preferred theme */
function getThemeFromBrowser(): string {
  return !Environment.isProduction && typeof window !== 'undefined'
    ? localStorage.getItem('theme') ??
        (window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light')
    : 'light'
}

/** Sets 'dark' class & css variables on <html>  */
const applyTheme = (theme: string): void => {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

interface IThemeContext {
  theme?: string
  toggleTheme: () => void
  setTheme: (theme?: string) => void
}

const ThemeContext = createContext<IThemeContext>({
  theme: null,
  setTheme: () => null,
  toggleTheme: () => null,
})

export const useThemeContext = () => useContext(ThemeContext)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<string | null>()

  const toggleTheme = useCallback(() => {
    setTheme((theme) => {
      const actualTheme = theme ?? getThemeFromBrowser()
      return actualTheme === 'dark' ? 'light' : 'dark'
    })
  }, [setTheme])

  const useOSTheme = useCallback(() => {
    setTheme(null)
  }, [setTheme])

  const handleThemeChangeShortcut = useCallback((event: KeyboardEvent) => {
    if (event.ctrlKey && event.key === 'l') {
      toggleTheme()
    }
  }, [])

  useEffect(() => {
    if (!Environment.isProduction) {
      document.addEventListener('keypress', handleThemeChangeShortcut)
      return () => {
        document.removeEventListener('keypress', handleThemeChangeShortcut)
      }
    }
  }, [handleThemeChangeShortcut])

  useEffect(() => {
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
    theme: theme || getThemeFromBrowser(),
    setTheme,
    useOSTheme,
    toggleTheme,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
