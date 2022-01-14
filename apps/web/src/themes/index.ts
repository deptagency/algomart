import dark from './dark'
import light from './light'

/**
 * The default theme to load
 */
export const DEFAULT_THEME = 'light'
export const DARK_THEME = 'dark'

export const themes: IThemes = {
  light,
  dark,
}

export interface ITheme {
  [key: string]: string
}

export interface IThemes {
  [key: string]: ITheme
}

export interface IMappedTheme {
  [key: string]: string | null
}
