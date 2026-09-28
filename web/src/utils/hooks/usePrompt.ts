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

    // react-router stopped exposing `block` on this navigator when it moved off
    // the `history` package: 6.30 has push, replace, go, createHref and
    // encodeLocation, and nothing else. The declared range is `^6.3.0`, so an
    // install can land on a version without it, and calling it threw inside an
    // effect - which unmounts the whole tree, and is why opening a file in
    // Studio produced a blank page.
    //
    // Checking keeps in-app navigation blocking where the navigator offers it
    // and costs only the prompt where it does not. `usePrompt` warns on close
    // and reload through beforeunload regardless.
    if (typeof navigator.block !== 'function') return

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

/**
 * Warns before unsaved work is lost, on closing or reloading the page.
 */
export const usePrompt = (message: string, when = true) => {
  const blocker = useCallback(
    (tx: Transition) => {
      if (window.confirm(message)) tx.retry()
    },
    [message]
  )

  useEffect(() => {
    if (!when) return

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      // Older browsers read returnValue rather than the event.
      event.returnValue = message

      return message
    }

    window.addEventListener('beforeunload', onBeforeUnload)

    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [message, when])

  useBlocker(blocker, when)
}
