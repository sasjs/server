import { NextFunction, Request, Response } from 'express'

/**
 * The documentation site carries its own inline scripts.
 *
 * Material for MkDocs writes a scope/hash helper (`__md_scope`, `__md_get`) into
 * every page, and `docs/theme/main.html` adds the palette block that follows the
 * interface's colour scheme. helmet's default `script-src 'self'` refuses every
 * one of them: the browser reports the violation and then throws
 * `ReferenceError: __md_get is not defined`, which leaves search and the palette
 * dead on each page the server serves.
 *
 * The relaxation is applied to the docs mount ONLY, and by ADDING one keyword to
 * `script-src` rather than replacing the policy, so an operator's
 * HELMET_CSP_CONFIG_PATH keeps every directive it set. The pages are static
 * files this repository builds at release time - there is no user content among
 * them - which is what makes 'unsafe-inline' acceptable here and not elsewhere.
 */
export const allowInlineScripts = (policy: string): string => {
  const directives = policy
    .split(';')
    .map((directive) => directive.trim())
    .filter(Boolean)

  let hasScriptSrc = false

  const relaxed = directives.map((directive) => {
    // `script-src-attr` and `script-src-elem` are different directives; matching
    // on the prefix would relax them by accident.
    if (!/^script-src(\s|$)/i.test(directive)) return directive

    hasScriptSrc = true

    return /\bunsafe-inline\b/i.test(directive)
      ? directive
      : `${directive} 'unsafe-inline'`
  })

  // With no `script-src`, a page falls back to `default-src`, so the keyword has
  // to be introduced as a directive of its own or it is simply ignored.
  if (!hasScriptSrc) relaxed.push("script-src 'self' 'unsafe-inline'")

  return relaxed.join('; ')
}

/**
 * Rewrites the policy helmet has already set, for the docs mount only.
 *
 * helmet writes the header during its own middleware, so a later `setHeader` is
 * what changes the answer: the wrapper `configureSecurity` installs for the
 * plain listener still sees this write and strips `upgrade-insecure-requests`
 * from it as it would any other.
 */
export const docsInlineScripts = (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  const current = res.getHeader('Content-Security-Policy')

  if (typeof current === 'string')
    res.setHeader('Content-Security-Policy', allowInlineScripts(current))

  next()
}
