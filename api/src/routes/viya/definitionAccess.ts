import type { Request } from 'express'

// A request property could be forged by a body parser or a caller. Only the guard
// holds a reference to the actual request and can grant access in this map.
const definitions = new WeakSet<Request>()

export const grantDefinitionAccess = (req: Request): void => {
  definitions.add(req)
}

export const hasDefinitionAccess = (req: Request): boolean =>
  definitions.has(req)
