import type * as monaco from 'monaco-editor'

import {
  SAS_LANGUAGE_ID,
  sasLanguageConfiguration,
  sasMonarchLanguage
} from './sasLanguage'

let isRegistered = false

/**
 * Registers the SAS language with Monaco. Idempotent, so it is safe to call
 * before every editor mount.
 *
 * The Monaco API arrives as an argument rather than as an import, which keeps
 * this module free of any runtime dependency on the editor and therefore
 * testable outside a browser. Callers in the app use the bound version exported
 * from ./sas.
 */
export const registerSasLanguage = (monacoApi: typeof monaco): void => {
  if (isRegistered) return
  isRegistered = true

  monacoApi.languages.register({
    id: SAS_LANGUAGE_ID,
    extensions: ['.sas'],
    aliases: ['SAS', 'sas']
  })
  monacoApi.languages.setLanguageConfiguration(
    SAS_LANGUAGE_ID,
    sasLanguageConfiguration
  )
  monacoApi.languages.setMonarchTokensProvider(
    SAS_LANGUAGE_ID,
    sasMonarchLanguage
  )
}
