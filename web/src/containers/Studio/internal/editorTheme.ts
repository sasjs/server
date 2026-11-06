import * as monaco from 'monaco-editor'

/**
 * The theme the editor runs under: the default light theme, with the marker
 * underlines switched on.
 *
 * Monaco leaves `editorError.border` and its three siblings NULL in both the
 * light and the dark theme - the registry documents them as "if set, colour of
 * double underlines for errors in the editor" - so a marked line carries no
 * visible squiggle unless the theme sets one. The findings were still there: the
 * hover knew them and the marker elements were in the DOM, which is why an
 * assertion on the element's presence passed while a reader saw nothing at all.
 *
 * `inherit: true` keeps every other colour of the default theme, so this adds
 * four underlines and changes nothing else.
 */
export const SASJS_EDITOR_THEME = 'sasjs'

export const defineEditorTheme = (): void => {
  monaco.editor.defineTheme(SASJS_EDITOR_THEME, {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      // The foreground colours of the same severities, so a squiggle matches the
      // text colour a reader already associates with it.
      'editorError.border': '#E51400',
      'editorWarning.border': '#BF8803',
      'editorInfo.border': '#1A85FF',
      'editorHint.border': '#8A8A8A'
    }
  })

  monaco.editor.setTheme(SASJS_EDITOR_THEME)
}
