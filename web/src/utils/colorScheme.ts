/**
 * Which colour scheme the app runs in.
 *
 * The preference is one of three values and the mode is one of two: `system`
 * is not a mode, it is an instruction to ask the OS. Keeping the resolution in
 * a pure function means the precedence - an explicit choice beats the OS, an
 * unreadable value falls back to the OS - is testable without a browser.
 */
export type ColorMode = 'light' | 'dark'
export type ColorThemePreference = 'system' | 'light' | 'dark'

/** The media query whose match means the OS asks for a dark interface. */
export const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)'

export const resolveColorMode = (
  preference: ColorThemePreference | string,
  osPrefersDark: boolean
): ColorMode => {
  if (preference === 'light' || preference === 'dark') return preference

  return osPrefersDark ? 'dark' : 'light'
}

/** The preference that turns the current mode into the other one. */
export const oppositePreference = (mode: ColorMode): ColorMode =>
  mode === 'dark' ? 'light' : 'dark'
