import fs from 'fs-extra'
import os from 'os'
import path from 'path'

import {
  BUNDLE_NAME,
  BUNDLE_VERSION_LENGTH,
  bundleVersionFor,
  webPageWithBundleVersion,
  withBundleVersion
} from '../webBuild'

const PAGE =
  '<html><head><script defer src=./index.bundle.js></script></head></html>'

describe('webBuild', () => {
  const bundle = 'console.log("a build of the bundle")'

  describe('bundleVersionFor', () => {
    it('should be stable for the same contents', () => {
      expect(bundleVersionFor(bundle)).toEqual(bundleVersionFor(bundle))
    })

    it('should change when the contents change', () => {
      // The whole point: a rebuild has to produce a different reference, or a
      // cached browser keeps the old UI.
      expect(bundleVersionFor(bundle)).not.toEqual(
        bundleVersionFor(bundle + ' // rebuilt')
      )
    })

    it('should be a fixed-length hex token', () => {
      const version = bundleVersionFor(bundle)

      expect(version).toHaveLength(BUNDLE_VERSION_LENGTH)
      expect(version).toMatch(/^[0-9a-f]+$/)
    })
  })

  describe('withBundleVersion', () => {
    it('should put the token on the bundle reference', () => {
      const html = '<script defer src=./index.bundle.js></script>'

      expect(withBundleVersion(html, 'abc123')).toEqual(
        '<script defer src=./index.bundle.js?v=abc123></script>'
      )
    })

    it('should handle a quoted reference', () => {
      const html = '<script defer src="./index.bundle.js"></script>'

      expect(withBundleVersion(html, 'abc123')).toEqual(
        '<script defer src="./index.bundle.js?v=abc123"></script>'
      )
    })

    it('should not add a second query string to a reference that has one', () => {
      const html = '<script defer src=./index.bundle.js?v=old></script>'

      expect(withBundleVersion(html, 'abc123')).toEqual(html)
    })

    it('should leave the rest of the page alone', () => {
      const html =
        '<head><title>index.bundle.js is a nice name</title><script src=./index.bundle.js></script><link href=./favicon.ico></head>'

      // Only an attribute that names the bundle is a reference; the same words
      // in prose, and every other attribute, gain nothing.
      expect(withBundleVersion(html, 'abc123')).toEqual(
        '<head><title>index.bundle.js is a nice name</title><script src=./index.bundle.js?v=abc123></script><link href=./favicon.ico></head>'
      )
    })
  })

  describe('webPageWithBundleVersion', () => {
    const folders: string[] = []

    /** A build folder holding the page and a bundle of the given contents. */
    const buildFolder = async (contents: string) => {
      const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'web-build-'))
      folders.push(folder)

      await fs.writeFile(path.join(folder, 'index.html'), PAGE)
      await fs.writeFile(path.join(folder, BUNDLE_NAME), contents)

      return path.join(folder, 'index.html')
    }

    afterEach(async () => {
      await Promise.all(folders.splice(0).map((folder) => fs.remove(folder)))
    })

    it('should version the served page by the bundle on disk', async () => {
      const htmlPath = await buildFolder(bundle)

      await expect(webPageWithBundleVersion(htmlPath)).resolves.toEqual(
        `<html><head><script defer src=./index.bundle.js?v=${bundleVersionFor(
          bundle
        )}></script></head></html>`
      )
    })

    it('should version a rebuild differently', async () => {
      // A rebuild of the same page has to produce a different reference, which
      // is the behaviour a returning browser depends on.
      const first = await webPageWithBundleVersion(await buildFolder(bundle))
      const rebuilt = await webPageWithBundleVersion(
        await buildFolder(bundle + ' // rebuilt')
      )

      expect(rebuilt).not.toEqual(first)
    })

    it('should serve the page as it is when there is no bundle', async () => {
      const htmlPath = await buildFolder(bundle)
      await fs.remove(path.join(path.dirname(htmlPath), BUNDLE_NAME))

      await expect(webPageWithBundleVersion(htmlPath)).resolves.toEqual(PAGE)
    })

    it('should reject when there is no page, so the router can fall back', async () => {
      const htmlPath = await buildFolder(bundle)
      await fs.remove(htmlPath)

      await expect(webPageWithBundleVersion(htmlPath)).rejects.toThrow()
    })
  })
})
