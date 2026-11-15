// a type, so it is erased: no runtime import cycle with the pane that uses this
import type { BlockedReason } from '../components/framedPane'

/**
 * Why a frame that has not loaded is still empty.
 *
 * The pane arms one timer when it mounts and reads the frame's own load event
 * before it fires. An empty frame after that wait is either a page that never
 * arrived or one that was never written:
 *
 *   - never arrived is what the timer is for;
 *   - never written is what the caller knows before the frame mounts, and says so
 *     once its probe answers - and that verdict must outlive the timer, or a
 *     console a build left out is reported as a slow proxy ten seconds later,
 *     which is the diagnosis the probe exists to avoid.
 *
 * `null` means nothing to report: the frame loaded, or the reason is already
 * known and set.
 */
export const expiredReason = (
  loaded: boolean,
  absent: boolean
): BlockedReason | null => {
  if (absent) return 'absent'
  return loaded ? null : 'unavailable'
}

/**
 * The reason a pane shows once the caller says whether the page was written.
 *
 * The prop is not one-way. A probe made before the site's worker controls the page
 * is provisional, so the caller can withdraw `absent` when a second one finds the
 * console - and a pane that only ever added `absent` would keep covering a page it
 * is now framing. Nothing else is cleared: a refusal and a timeout are facts about
 * the frame, and the frame has not changed.
 */
export const mirroredReason = (
  absent: boolean,
  current: BlockedReason | null
): BlockedReason | null => {
  if (absent) return 'absent'

  return current === 'absent' ? null : current
}
