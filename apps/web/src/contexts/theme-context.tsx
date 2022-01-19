import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

const DEFAULT_THEME = 'light'

/** Returns the theme set in localStorage, else the OS preferred theme */
function getThemeFromBrowser(): string {
  return (
    localStorage.getItem('theme') ??
    (window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light')
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

interface IThemeContext {
  theme?: string
  toggleTheme: () => void
  setTheme: (theme?: string) => void
}

const ThemeContext = createContext<IThemeContext>({
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
