import { useEffect, useCallback, useContext } from 'react'
import { UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom'
import { History, Blocker, Transition } from 'history'

function useBlocker(blocker: Blocker, when = true) {
  const navigator = useContext(NavigationContext).navigator as History

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

export default function usePrompt(message: string, when = true) {
  const blocker = useCallback(
    (tx) => {
      if (window.confirm(message)) tx.retry()
    },
    [message]
  )

  useBlocker(blocker, when)
}
