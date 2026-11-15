/**
 * `@sasjs/sas-language` publishes its entry points through an `exports` map, and
 * this project's `moduleResolution` (node10) cannot read one, so TypeScript
 * reports "Cannot find module '@sasjs/sas-language/format'" even though the
 * package ships the declaration beside the file.
 *
 * Only what the server calls is declared, and loosely on purpose: pinning the
 * upstream signature here would mean editing this file whenever it changed. The
 * shape is the one the formatter documents, and `formatText` from `@sasjs/lint`
 * defines the contract the reprint has to meet.
 */
declare module '@sasjs/sas-language/format' {
  export function formatText(
    text: string,
    options?: {
      tabWidth?: number
      useTabs?: boolean
      dataRoot?: string
      keywordCase?: 'upper' | 'lower' | 'preserve'
    }
  ): Promise<string>
}
