import { APP_ID_LENGTH, appIdFor, normaliseAppLoc } from '../appStreamIdentity'

/**
 * The id is an app's identity, so the properties pinned here are the ones that
 * would hurt if they broke: same folder means same id, different folder means
 * different id, and the id does not move because someone wrote the path
 * differently.
 */
describe('App Stream identity', () => {
  describe('normalising an app location', () => {
    it('treats every reasonable spelling of one folder as one folder', () => {
      const expected = '/Public/apps/mario'

      for (const spelling of [
        '/Public/apps/mario',
        '/Public/apps/mario/',
        'Public/apps/mario',
        '//Public//apps//mario',
        '  /Public/apps/mario  ',
        '/Public/apps/mario///'
      ]) {
        expect(normaliseAppLoc(spelling)).toBe(expected)
      }
    })

    it('keeps the drive root as the drive root', () => {
      expect(normaliseAppLoc('/')).toBe('/')
      expect(normaliseAppLoc('')).toBe('/')
    })

    it('does not fold case: two folders that differ in case are two folders', () => {
      expect(normaliseAppLoc('/Public/Apps/Mario')).toBe('/Public/Apps/Mario')
      expect(appIdFor('/Public/Apps/Mario')).not.toBe(
        appIdFor('/Public/apps/mario')
      )
    })
  })

  describe('deriving the id', () => {
    it('is stable across spellings of the same location', () => {
      const id = appIdFor('/Public/apps/mario')

      expect(appIdFor('/Public/apps/mario/')).toBe(id)
      expect(appIdFor('//Public//apps//mario')).toBe(id)
    })

    it('is eight hex characters', () => {
      expect(appIdFor('/Public/apps/mario')).toMatch(/^[0-9a-f]{8}$/)
      expect(APP_ID_LENGTH).toBe(8)
    })

    it('differs for different locations', () => {
      expect(appIdFor('/Public/apps/mario')).not.toBe(
        appIdFor('/Public/apps/sonic')
      )
    })

    it('grows rather than colliding when its prefix is taken', () => {
      const id = appIdFor('/Public/apps/mario')
      const extended = appIdFor('/Public/apps/mario', [id])

      expect(extended).not.toBe(id)
      expect(extended).toMatch(/^[0-9a-f]{12}$/)
      expect(extended.startsWith(id)).toBe(true)
    })

    it('ignores ids belonging to other apps, which is the ordinary case', () => {
      const other = appIdFor('/Public/apps/sonic')

      expect(appIdFor('/Public/apps/mario', [other])).toMatch(/^[0-9a-f]{8}$/)
    })
  })

  describe('the identity is the folder, not the stream within it', () => {
    it('gives one folder one id however many streams it holds', () => {
      // a second stream under the same folder is the same app; the taken set is
      // built from OTHER folders, so this cannot grow the id
      const shared = appIdFor('/Public/apps/mario')

      expect(appIdFor('/Public/apps/mario', [shared])).toMatch(/^[0-9a-f]{12}$/)

      // which is why the registry excludes same-folder entries before calling it,
      // and the id is then the plain eight characters
      const takenFromOtherFolders = [appIdFor('/Public/apps/sonic')]

      expect(appIdFor('/Public/apps/mario', takenFromOtherFolders)).toBe(shared)
    })
  })
})
