import * as monaco from 'monaco-editor'

import { registerSasLanguage as register } from './register'

export {
  SAS_LANGUAGE_ID,
  sasLanguageConfiguration,
  sasMonarchLanguage
} from './sasLanguage'

/**
 * Registers the SAS language with Monaco, bound to the editor that the app
 * bundles. Idempotent, so it is safe to call before every editor mount.
 */
export const registerSasLanguage = (): void => register(monaco)
