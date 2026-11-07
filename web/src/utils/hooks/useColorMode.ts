import { useEffect, useState } from 'react'

import { ColorMode, DARK_SCHEME_QUERY, resolveColorMode } from '../colorScheme'
import { useSetting } from './useSetting'

/**
 * The colour scheme the app should draw, and the way to change it.
 *
 * The OS preference is read through `matchMedia` and watched, so a machine
 * that switches at sunset moves the Studio with it - until the user picks a
 * scheme, at which point the stored preference wins and the OS is ignored.
 * The listener is only attached for `system`, so a pinned choice does not
 * re-render on a change that cannot affect it.
 */
export const useColorMode = (): [ColorMode, (mode: ColorMode) => void] => {
  const [preference, setPreference] = useSetting('workbench.colorTheme')

  const [osPrefersDark, setOsPrefersDark] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia(DARK_SCHEME_QUERY).matches
  )

  useEffect(() => {
    if (preference !== 'system' || typeof window === 'undefined') return
    if (typeof window.matchMedia !== 'function') return

    const query = window.matchMedia(DARK_SCHEME_QUERY)
    const onChange = (event: MediaQueryListEvent) =>
      setOsPrefersDark(event.matches)

    setOsPrefersDark(query.matches)
    query.addEventListener('change', onChange)

    return () => query.removeEventListener('change', onChange)
  }, [preference])

  const mode = resolveColorMode(preference, osPrefersDark)

  return [mode, (next: ColorMode) => setPreference(next)]
}
