import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'

import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'

import {
  ROOT_PATH,
  ancestorPathsOf,
  expandedDescendantsOf,
  graftLevel,
  parentPathOf
} from '../../utils/driveTree'
import { TreeNode } from '../../utils/types'
import { homeFilePathFor } from '../../utils/userHome'
import {
  forgetLastFile,
  recallLastFile,
  rememberLastFile
} from '../../utils/lastFile'
import { AppContext } from '../../context/appContext'

import SideBar from './sideBar'
import SASjsEditor from './editor'

const Studio = () => {
  const { username } = React.useContext(AppContext)
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedFilePath, setSelectedFilePath] = useState('')
  const [directoryData, setDirectoryData] = useState<TreeNode | null>(null)
  const [expanded, setExpanded] = useState<string[]>([ROOT_PATH])
  const [tab, setTab] = useState('code')

  // One default-file resolution per Studio session: a re-render or a tab
  // switch must not re-create the program or fight the user's open file.
  const defaultFileRequested = useRef(false)

  // Refs, not state: these are consulted inside callbacks that must not be
  // rebuilt on every fetch, and a folder must never be requested twice.
  const loadedFolders = useRef<Set<string>>(new Set())
  const expandedRef = useRef<Set<string>>(new Set([ROOT_PATH]))
  // The in-flight request per folder, as a promise. Deduplicating on the
  // promise (rather than on a set of paths) is what lets a caller AWAIT a
  // request another caller started - the deep-link walk depends on that to sit
  // behind the root fetch instead of racing it.
  const folderRequests = useRef<Map<string, Promise<void>>>(new Map())
  // The authoritative tree. State mirrors it for rendering; keeping the
  // readable copy in a ref is what lets a fetch decide whether its level can be
  // grafted BEFORE it records the folder as loaded, and is why this callback
  // needs no state updater.
  const treeRef = useRef<TreeNode | null>(null)

  useEffect(() => {
    const fromUrl = searchParams.get('filePath') ?? ''

    setSelectedFilePath(fromUrl)

    // Whatever the user opens is what they expect to find again - and a file
    // can arrive two ways: from the tree (handleSelect) or from the URL (a
    // deep link, a reload, the back button). Both land here, so this is the
    // one place that remembers it.
    if (fromUrl && username) rememberLastFile(username, fromUrl)
  }, [searchParams, username])

  /**
   * Fetches one folder's immediate children and grafts them into the tree.
   *
   * The drive is loaded a level at a time - the whole tree is not requested on
   * page load, so opening Studio costs one readdir of the root instead of a
   * stat and a readdir for every entry on the drive.
   */
  const fetchFolder = useCallback(
    (folderPath: string, force?: boolean): Promise<void> => {
      if (!force && loadedFolders.current.has(folderPath))
        return Promise.resolve()

      const inFlight = folderRequests.current.get(folderPath)

      if (!force && inFlight) return inFlight

      const request = (async () => {
        try {
          const res = await axios.get('/SASjsApi/drive/fileTree', {
            params: { _folderPath: folderPath }
          })

          if (res.data?.status === 'success') {
            const level = { ...res.data.tree, childrenLoaded: true } as TreeNode
            const previous = treeRef.current

            // A folder level arriving before the root must never BECOME the
            // tree: the drive root is the only node whose relativePath is '' and
            // every later graft walks from it. That, and a level whose path no
            // node carries, both come back as null - and a level that was not
            // grafted is NOT recorded as loaded, so the next expand requests it
            // again instead of leaving a childless node for ever.
            const next =
              previous === null
                ? folderPath === ROOT_PATH
                  ? level
                  : null
                : graftLevel(previous, folderPath, level)

            if (next !== null) {
              // Replacing a level replaces its whole subtree, so anything loaded
              // underneath it is now stale.
              const prefix = folderPath === ROOT_PATH ? '/' : `${folderPath}/`

              Array.from(loadedFolders.current).forEach((loaded) => {
                if (loaded.startsWith(prefix))
                  loadedFolders.current.delete(loaded)
              })

              loadedFolders.current.add(folderPath)
              treeRef.current = next
              setDirectoryData(next)

              // ...but the folders the user has OPEN under it stay open, and
              // expansion is what triggers a fetch - so re-read them here, or
              // the tree settles on a placeholder that never resolves.
              const reopen = expandedDescendantsOf(
                expandedRef.current,
                folderPath
              )

              for (const descendant of reopen) await fetchFolder(descendant)
            }
          }
        } catch (err) {
          console.log(err)
        } finally {
          folderRequests.current.delete(folderPath)
        }
      })()

      folderRequests.current.set(folderPath, request)

      return request
    },
    []
  )

  useEffect(() => {
    fetchFolder(ROOT_PATH)
  }, [fetchFolder])

  // A deep link (?filePath=/Public/app/services/run.sas) has to open the folders
  // above the file, and their contents arrive one level at a time, so walk the
  // ancestors in order before expanding them.
  useEffect(() => {
    if (!selectedFilePath) return

    let cancelled = false

    const openAncestors = async () => {
      const ancestors = ancestorPathsOf(selectedFilePath)

      // The root is awaited first: the ancestors are grafted onto it, so a
      // level that resolves before the root has nowhere to go.
      await fetchFolder(ROOT_PATH)

      for (const ancestor of ancestors) {
        if (cancelled) return
        await fetchFolder(ancestor)
      }

      if (cancelled) return

      const next = new Set(Array.from(expandedRef.current).concat(ancestors))
      expandedRef.current = next
      setExpanded(Array.from(next))
    }

    openAncestors()

    return () => {
      cancelled = true
    }
  }, [selectedFilePath, fetchFolder])

  const handleExpandedChange = useCallback(
    (expandedPaths: string[]) => {
      const newlyExpanded = expandedPaths.filter(
        (path) => !expandedRef.current.has(path)
      )

      expandedRef.current = new Set(expandedPaths)
      setExpanded(expandedPaths)

      // Expanding a folder is the moment its contents are needed.
      newlyExpanded.forEach((path) => fetchFolder(path))
    },
    [fetchFolder]
  )

  const handleSelect = (filePath: string, refreshSideBar?: boolean) => {
    setSearchParams({ filePath })
    if (refreshSideBar) fetchFolder(parentPathOf(filePath), true)
  }

  /**
   * Where the editor opens when Studio is entered without a file.
   *
   * A fresh buffer used to have no path at all: Run injected no `_program`,
   * Save needed a modal before anything could be written, and the explorer
   * showed nothing - a file with no home. Studio now resolves one:
   *
   *   1. the file the user was last in, if the drive still has it;
   *   2. otherwise their default program, /home/<username>/program.sas.
   *
   * The default program is only ever CREATED. The drive refuses a second POST
   * for an existing file with 409 and that is treated as success, so reopening
   * Studio shows the program instead of replacing it.
   *
   * A refusal - no drive grant, a read-only drive - is not fatal: it is logged
   * and the editor falls back to the unsaved buffer it had before.
   */
  useEffect(() => {
    // Wait for the session: the home path is built from the username.
    if (!username) return

    // The URL wins: opening Studio at a file must not create or replace one.
    // `selectedFilePath` is still empty on the first pass - the search-params
    // effect above has set it as state, not as a render value - so the query
    // string is consulted directly.
    if (
      selectedFilePath ||
      searchParams.get('filePath') ||
      defaultFileRequested.current
    )
      return

    defaultFileRequested.current = true

    /** Whether the drive still has this file. A lost grant reads the same. */
    const isOnDrive = async (filePath: string): Promise<boolean> => {
      try {
        await axios.get('/SASjsApi/drive/file', {
          params: { _filePath: filePath }
        })
        return true
      } catch {
        return false
      }
    }

    const resolveDefaultFile = async (): Promise<string> => {
      const remembered = recallLastFile(username)

      if (remembered && (await isOnDrive(remembered))) return remembered

      // Gone since it was remembered (deleted, moved, renamed).
      if (remembered) forgetLastFile(username)

      const filePath = homeFilePathFor(username)

      const formData = new FormData()
      formData.append('file', new Blob([''], { type: 'text/plain' }))
      formData.append('filePath', filePath)

      await axios.post('/SASjsApi/drive/file', formData).catch((err) => {
        // 409: the program is already there. Open it, never replace it.
        if (err?.response?.status !== 409) throw err
      })

      return filePath
    }

    resolveDefaultFile()
      // The root was read before the home folder existed, so re-read it before
      // pointing the editor at the file: the deep-link walk can only open the
      // ancestors of a path whose top level is already in the tree.
      .then(async (filePath) => {
        await fetchFolder(ROOT_PATH, true)
        handleSelect(filePath)
      })
      .catch((err) => console.log(err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilePath, username, searchParams])

  const removeFileFromTree = (path: string) => {
    if (treeRef.current) {
      const newTree = JSON.parse(JSON.stringify(treeRef.current)) as TreeNode
      findAndRemoveNode(newTree, newTree, path)
      treeRef.current = newTree
      setDirectoryData(newTree)

      // A deleted folder takes its loaded levels with it, and its parent may now
      // be empty - so let the next visit fetch it again.
      loadedFolders.current.forEach((loaded) => {
        if (loaded === path || loaded.startsWith(`${path}/`))
          loadedFolders.current.delete(loaded)
      })
    }
  }

  const findAndRemoveNode = (
    node: TreeNode,
    parentNode: TreeNode,
    path: string
  ) => {
    if (node.relativePath === path) {
      removeNodeFromParent(parentNode, path)
      // reset selected file path and file path query param
      if (
        node.relativePath === selectedFilePath ||
        selectedFilePath.startsWith(node.relativePath)
      ) {
        // The open file is gone: forget it so the next Studio entry does not
        // try to open a path that no longer exists, and let the default-file
        // effect run again.
        forgetLastFile(username)
        defaultFileRequested.current = false
        setSearchParams({})
      }
      return true
    }
    if (Array.isArray(node.children)) {
      for (let i = 0; i < node.children.length; i++) {
        if (findAndRemoveNode(node.children[i], node, path)) return
      }
    }
  }

  const removeNodeFromParent = (parent: TreeNode, path: string) => {
    const index = parent.children.findIndex(
      (node) => node.relativePath === path
    )
    if (index !== -1) {
      parent.children.splice(index, 1)
    }
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {/* The explorer is part of the screen, not part of the Code tab: a run
          switches the right-hand pane to the log, and hiding the tree with it
          took the file list away exactly when the user needed it. */}
      <SideBar
        selectedFilePath={selectedFilePath}
        directoryData={directoryData}
        expanded={expanded}
        onExpandedChange={handleExpandedChange}
        handleSelect={handleSelect}
        removeFileFromTree={removeFileFromTree}
        refreshFolder={(folderPath: string) => fetchFolder(folderPath, true)}
      />
      <SASjsEditor
        selectedFilePath={selectedFilePath}
        setSelectedFilePath={handleSelect}
        tab={tab}
        setTab={setTab}
      />
    </Box>
  )
}

export default Studio
