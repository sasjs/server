import * as monaco from 'monaco-editor'

import { ColorMode } from '../../../utils/colorScheme'

/**
 * The editor's own themes: the defaults, with the marker underlines switched
 * on, in a light and a dark pair.
 *
 * Monaco leaves `editorError.border` and its three siblings NULL in both the
 * light and the dark theme - the registry documents them as "if set, colour of
 * double underlines for errors in the editor" - so a marked line carries no
 * visible squiggle unless the theme sets one. The findings were still there: the
 * hover knew them and the marker elements were in the DOM, which is why an
 * assertion on the element's presence passed while a reader saw nothing at all.
 *
 * `inherit: true` keeps every other colour of the default theme, so this adds
 * four underlines and changes nothing else. The four are shared by both
 * schemes: they are the severities' own foreground colours, and a squiggle
 * that matched its text in the light theme still does in the dark one.
 */
const MARKER_BORDERS = {
  'editorError.border': '#E51400',
  'editorWarning.border': '#BF8803',
  'editorInfo.border': '#1A85FF',
  'editorHint.border': '#8A8A8A'
}

export const SASJS_EDITOR_THEME = 'sasjs'
export const SASJS_DARK_EDITOR_THEME = 'sasjs-dark'

/** The theme id for a colour scheme. */
export const editorThemeFor = (mode: ColorMode) =>
  mode === 'dark' ? SASJS_DARK_EDITOR_THEME : SASJS_EDITOR_THEME

/**
 * Defines both themes. The editor names the one it is to run under, which is
 * what makes the scheme apply: the wrapper calls `setTheme` with its own
 * default on mount, so a theme merely set here would be replaced as soon as an
 * editor mounted.
 */
export const defineEditorThemes = (): void => {
  monaco.editor.defineTheme(SASJS_EDITOR_THEME, {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: MARKER_BORDERS
  })

  monaco.editor.defineTheme(SASJS_DARK_EDITOR_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: MARKER_BORDERS
  })
}
