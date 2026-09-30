/**
 * Enables semantic colouring, which monaco's standalone themes carry no
 * switch for: StandaloneTheme hard-codes semanticHighlighting to false, so
 * the setting the feature itself reads is set through the configuration
 * service. With it on, a registered semantic tokens provider colours every
 * token it returns through the theme's rules.
 *
 * This is the one place Studio reaches past monaco's public API. The modules
 * are plain ESM inside monaco-editor, so they are importable; a monaco
 * upgrade that moves them fails the build here rather than silently losing
 * colouring.
 */
import { StandaloneServices } from 'monaco-editor/esm/vs/editor/standalone/browser/standaloneServices.js'
import { IConfigurationService } from 'monaco-editor/esm/vs/platform/configuration/common/configuration.js'

/** The slice of the two internal modules this file uses. */
type ConfigurationService = {
  updateValue(key: string, value: unknown): void
}

type Services = {
  get(serviceId: unknown): ConfigurationService
}

export const enableSemanticHighlighting = (): void => {
  const services = StandaloneServices as unknown as Services
  const configurationService = services.get(IConfigurationService)

  // The feature reads `.enabled` off the value:
  // getValue('editor.semanticHighlighting')?.enabled
  configurationService.updateValue('editor.semanticHighlighting', {
    enabled: true
  })
}
