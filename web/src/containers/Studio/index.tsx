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

import SideBar from './sideBar'
import SASjsEditor from './editor'

const Studio = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedFilePath, setSelectedFilePath] = useState('')
  const [directoryData, setDirectoryData] = useState<TreeNode | null>(null)
  const [expanded, setExpanded] = useState<string[]>([ROOT_PATH])
  const [tab, setTab] = useState('code')

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
    setSelectedFilePath(searchParams.get('filePath') ?? '')
  }, [searchParams])

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
      )
        setSearchParams({})
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
      {tab === 'code' && (
        <SideBar
          selectedFilePath={selectedFilePath}
          directoryData={directoryData}
          expanded={expanded}
          onExpandedChange={handleExpandedChange}
          handleSelect={handleSelect}
          removeFileFromTree={removeFileFromTree}
          refreshFolder={(folderPath: string) => fetchFolder(folderPath, true)}
        />
      )}
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
