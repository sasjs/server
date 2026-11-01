import { useSyncExternalStore } from 'react'
import {
  StudioSettings,
  readSettings,
  subscribeToSettings,
  writeSetting
} from '../../containers/Studio/internal/settings'

/**
 * Reads one Studio setting and writes it, keeping every reader in step.
 *
 * Several controls write the same key - the log tab's eye and the Settings
 * panel's switch both own `log.notableNotes` - so a component cannot hold the
 * value in its own state: the write notifies the store, and every component
 * reading that key renders again with the new value.
 */
export const useSetting = <K extends keyof StudioSettings>(
  key: K
): [StudioSettings[K], (value: StudioSettings[K]) => void] => {
  const value = useSyncExternalStore(
    subscribeToSettings,
    () => readSettings()[key],
    () => readSettings()[key]
  )

  return [value, (next: StudioSettings[K]) => writeSetting(key, next)]
}
