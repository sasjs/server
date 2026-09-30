/**
 * A Visual Studio Code-shaped settings store for the Studio editor.
 *
 * Studio has no filesystem, so the settings live in localStorage under one key
 * as a flat JSON object - the same shape VS Code uses for its own user
 * settings, where every entry is `[section].[name]`. Adding a setting is a
 * matter of adding a key here and giving it a default.
 */

export const SETTINGS_STORAGE_KEY = 'studio-settings'

/**
 * The settings Studio honours. Keys follow the VS Code `[section].[name]`
 * convention so the object reads like a settings.json.
 */
export interface StudioSettings {
  'editor.formatOnSave': boolean
}

export const defaultSettings: StudioSettings = {
  'editor.formatOnSave': true
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
}
