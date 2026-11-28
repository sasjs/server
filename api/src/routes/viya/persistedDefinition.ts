import type { Request } from 'express'
import path from 'path'
import { dispatchViya } from '@sasjs/api'
import { hasRoutePermission } from '../../middlewares/authorize'
import { serverDrive } from './services'

// Match only a uniquely named definition in the registered job's own folder.
// The code is data, never passed to an interpreter.
export const persistedDefinition = async (req: Request, selector: string) => {
  const savedUrl = req.url
  const savedBase = req.baseUrl
  try {
    for (const rule of [
      '/SASjsApi/drive/file',
      '/SASjsApi/drive/fileTree',
      '/SASjsApi/drive/folder'
    ]) {
      req.url = rule
      req.baseUrl = ''
      if (!(await hasRoutePermission(req)))
        throw new Error('Definition access denied')
    }
  } finally {
    req.url = savedUrl
    req.baseUrl = savedBase
  }
  const services = { drive: serverDrive() }
  const folder = await dispatchViya(services, 'GET', '/folders/folders/@item', {
    query: { path: path.posix.dirname(selector) }
  })
  if (folder.status !== 200) return undefined
  const members = await dispatchViya(
    services,
    'GET',
    `/folders/folders/${(folder.body as any).id}/members`,
    {}
  )
  const found =
    (members.body as any)?.items?.filter(
      (item: any) => item.name === path.posix.basename(selector)
    ) ?? []
  if (found.length !== 1 || found[0].contentType !== 'jobDefinition')
    return undefined
  const definition = await dispatchViya(services, 'GET', found[0].uri, {})
  const body = definition.body as {
    id?: unknown
    name?: unknown
    code?: unknown
  }
  if (
    definition.status !== 200 ||
    body.id !== found[0].id ||
    body.name !== found[0].name ||
    typeof body.code !== 'string'
  )
    return undefined
  return { id: body.id as string, code: body.code }
}
