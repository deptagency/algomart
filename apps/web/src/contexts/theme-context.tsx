import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import { Environment } from '@/environment'

export const themeOptions = ['light', 'dark', null]

/** Returns the theme set in localStorage, else the OS preferred theme */
function getThemeFromBrowser(): string {
  return (
    localStorage.getItem('theme') ??
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  )
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

const handleOsThemeChange = (event_: { matches: boolean }) => {
  applyTheme(event_.matches ? 'dark' : 'light')
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
  const browserTheme = useRef<string | null>(null)
  const [theme, setTheme] = useState<string | null>(null)

  const toggleTheme = useCallback(() => {
    setTheme((theme) => {
      // return themeOptions[(themeOptions.indexOf(theme) + 1) % themeOptions.length]
      const actualTheme = theme ?? getThemeFromBrowser()
      return actualTheme === 'dark' ? 'light' : 'dark'
    })
  }, [setTheme])

  const useOSTheme = useCallback(() => {
    setTheme(null)
  }, [setTheme])

  const handleThemeChangeShortcut = useCallback(
    (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'l') {
        toggleTheme()
      }
    },
    [toggleTheme]
  )

  useEffect(() => {
    if (!Environment.isProduction) {
      document.addEventListener('keypress', handleThemeChangeShortcut)
      return () => {
        document.removeEventListener('keypress', handleThemeChangeShortcut)
      }
    }
  }, [handleThemeChangeShortcut])

  useEffect(() => {
    if (!browserTheme.current) return

    if (theme) {
      localStorage.setItem('theme', theme)
      applyTheme(theme)
    } else {
      // use OS theme
      localStorage.removeItem('theme')
      applyTheme(getThemeFromBrowser())
      const media = matchMedia('(prefers-color-scheme: dark)')
      media.addEventListener('change', handleOsThemeChange)
      return () => {
        media.removeEventListener('change', handleOsThemeChange)
      }
    }
  }, [theme])

  useEffect(() => {
    if (window && !browserTheme.current) {
      const localTheme = getThemeFromBrowser()
      browserTheme.current = localTheme
      setTheme(localTheme)
    }
  }, [])

  const value = {
    theme,
    setTheme,
    useOSTheme,
    toggleTheme,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
