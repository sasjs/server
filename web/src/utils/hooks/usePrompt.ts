import { useEffect, useCallback, useContext } from 'react'
import { UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom'

/**
 * Minimal shape of history's navigation-blocking API. Declared locally
 * because the `history` package (a transitive dependency of react-router)
 * removed these type exports in v5; only the two members this hook touches
 * are needed.
 */
interface Transition {
  retry: () => void
}

interface Blocker {
  (tx: Transition): void
}

interface BlockableNavigator {
  block: (fn: (tx: Transition) => void) => () => void
}

const useBlocker = (blocker: Blocker, when = true) => {
  const navigator = useContext(NavigationContext)
    .navigator as unknown as BlockableNavigator

  useEffect(() => {
    if (!when) return

    const unblock = navigator.block((tx: Transition) => {
      const autoUnblockingTx = {
        ...tx,
        retry() {
          unblock()
          tx.retry()
        }
      }

      blocker(autoUnblockingTx)
    })

    return unblock
  }, [navigator, blocker, when])
}

export const usePrompt = (message: string, when = true) => {
  const blocker = useCallback(
    (tx) => {
      if (window.confirm(message)) tx.retry()
    },
    [message]
  )

  useBlocker(blocker, when)
}
