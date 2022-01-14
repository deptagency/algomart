import { IMappedTheme, ITheme, themes } from './'

/** Returns the theme set in localStorage, else the OS preferred theme */
export function getThemeFromBrowser(): string {
  return (
    localStorage.getItem('theme') ??
    (window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light')
  )
}

/** Produces an object mapping css variables to values. */
export const mapTheme = (variables: ITheme): IMappedTheme =>
  Object.keys(variables).reduce((accumulator, key) => {
    if (key === 'themeType') return accumulator
    accumulator[`--${key}`] = variables[key] || ''
    return accumulator
  }, {} as IMappedTheme)

export const extendTheme = (extending: ITheme, newTheme: ITheme): ITheme => ({
  ...extending,
  ...newTheme,
})

/** Sets 'dark' class & css variables on <html>  */
export const applyTheme = (theme: string): void => {
  const themeObject: IMappedTheme = mapTheme(themes[theme])
  if (!themeObject) return

  const root = document.documentElement

  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }

  for (const property of Object.keys(themeObject)) {
    if (property === 'name') {
      continue
    }

    root.style.setProperty(property, themeObject[property])
  }
}
