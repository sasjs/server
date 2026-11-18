import { promises as fs } from 'fs'
import path from 'path'

const isInside = (root: string, target: string): boolean => {
  const relative = path.relative(root, target)
  return !path.isAbsolute(relative) && relative.split(path.sep)[0] !== '..'
}

/** Resolve an existing mock response within the SAS 9 mock root, including symlinks. */
export const resolveMockResponsePath = async (
  mockBase: string,
  parts: string[]
): Promise<string> => {
  const root = path.resolve(mockBase, 'sas9')
  const target = path.resolve(root, ...parts)
  if (!isInside(root, target)) throw new Error('Invalid mock response path')

  const realRoot = await fs.realpath(root)
  const realTarget = await fs.realpath(target)
  if (!isInside(realRoot, realTarget))
    throw new Error('Invalid mock response path')
  return realTarget
}
