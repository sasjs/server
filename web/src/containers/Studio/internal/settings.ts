/**
 * A Visual Studio Code-shaped settings store for the Studio editor.
 *
 * Studio has no filesystem, so the settings live in localStorage under one key
 * as a flat JSON object - the same shape VS Code uses for its own user
 * settings, where every entry is `[section].[name]`. Adding a setting is a
 * matter of adding a key here and giving it a default.
 */
import type { ColorThemePreference } from '../../../utils/colorScheme'

export const SETTINGS_STORAGE_KEY = 'studio-settings'

/**
 * Listeners told when any setting is written.
 *
 * The store is localStorage, which React cannot observe, and more than one
 * control writes the same key - the log tab's eye and the Settings panel's
 * switch. Without this the two disagree until a reload.
 */
const listeners = new Set<() => void>()

/** Registers a listener; returns the unsubscribe, as `useSyncExternalStore` expects. */
export const subscribeToSettings = (listener: () => void): (() => void) => {
  listeners.add(listener)

  return () => void listeners.delete(listener)
}

/**
 * The settings Studio honours. Keys follow the VS Code `[section].[name]`
 * convention so the object reads like a settings.json.
 */
export interface StudioSettings {
  'editor.formatOnSave': boolean
  'log.notableNotes': boolean
  /**
   * The colour scheme. `system` follows the OS and is the default, so an
   * install nobody has touched looks like the rest of the desktop; a stored
   * `light` or `dark` is a choice the user made here and wins over the OS.
   */
  'workbench.colorTheme': ColorThemePreference
}

export const defaultSettings: StudioSettings = {
  'editor.formatOnSave': true,
  'log.notableNotes': true,
  'workbench.colorTheme': 'system'
}

/**
 * Reads the settings, falling back to the defaults for any key that is absent.
 * A corrupt or unparsable store resets to the defaults rather than breaking
 * the editor: settings are convenience, not state.
 */
export const readSettings = (): StudioSettings => {
  let stored: unknown
  try {
    stored = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '')
  } catch {
    return { ...defaultSettings }
  }

  if (typeof stored !== 'object' || stored === null) {
    return { ...defaultSettings }
  }

  const settings = { ...defaultSettings }
  for (const key of Object.keys(defaultSettings) as (keyof StudioSettings)[]) {
    const value = (stored as Record<string, unknown>)[key]
    if (typeof value === typeof settings[key]) {
      settings[key] = value as never
    }
  }

  return settings
}

/**
 * Persists a single setting, leaving the others as they are.
 */
export const writeSetting = <K extends keyof StudioSettings>(
  key: K,
  value: StudioSettings[K]
): void => {
  localStorage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify({ ...readSettings(), [key]: value })
  )

  listeners.forEach((listener) => listener())
}
