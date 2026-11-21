/**
 * The two requests a drive search makes, in one place.
 *
 * Both the header's box (which lists the drive by file name) and a folder's own
 * search (which reads the bodies too) ask the drive the same two questions, and a
 * second copy of either would be a second place for the base URL, the params or
 * the refusal rule to drift. The readers are plain functions rather than a hook so
 * a caller decides what to do with a failure - both answer null for a folder or a
 * file they cannot have, which is the whole of the error handling a search needs.
 */
import axios from 'axios'

import type { TreeNode } from './types'

/**
 * One folder's immediate children, as the explorer reads them.
 *
 * Read through the shared axios instance: it carries `baseURL: apiBaseUrl` - the
 * API's own origin under `npm start`, which the dev server answers only for
 * `/SASjsApi`, `/api` and `/docs` - and `withCredentials`, without which a
 * deployment on another origin drops the session cookie.
 *
 * A folder that cannot be read answers null rather than throwing. That is not a
 * failure unique to a search: the caller may hold no grant for that folder, or the
 * folder may have gone between the listing and the request, and either way the
 * rest of the drive is still worth walking.
 */
export const listFolder = (folderPath: string) =>
  axios
    .get('/SASjsApi/drive/fileTree', {
      params: { _folderPath: folderPath }
    })
    .then((response) =>
      response.data?.status === 'success'
        ? (response.data.tree as TreeNode)
        : null
    )
    .catch(() => null)

/**
 * One file's body, as the editor reads a file it is about to open.
 *
 * Asked with `responseType: 'text'`, because a `.json` file is a body a search has
 * to read as text: the shared instance's default would parse it into an object,
 * and a folder search would then be searching the string "[object Object]". A file
 * that cannot be read answers null for the reason `listFolder` gives - a refusal
 * ends that file, not the folder.
 *
 * The route answers with the whole file - there is no byte range and no length
 * parameter - so the per-file cap in `contentSearch` bounds the SEARCH rather than
 * the transfer: a large log is downloaded in full and then cut. Trimming the
 * transfer would mean a partial read on the server, which is a change to the drive
 * route's contract rather than to any caller here.
 */
export const readFileText = (filePath: string) =>
  axios
    .get('/SASjsApi/drive/file', {
      params: { _filePath: filePath },
      responseType: 'text'
    })
    .then((response) =>
      typeof response.data === 'string' ? response.data : null
    )
    .catch(() => null)
