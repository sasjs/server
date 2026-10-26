/**
 * Stands in for the Docker Hub tag listing, so the bump script can be exercised
 * without the network and without depending on what Docker Hub happens to hold
 * today. Loaded with `node --import`, which runs before the script under test.
 *
 * FIXTURE_TAGS is a JSON file holding the `results` array the Hub would return.
 */
import { readFileSync } from 'node:fs'

const fixture = process.env.FIXTURE_TAGS

globalThis.fetch = async (url) => {
  if (!String(url).includes('/tags?'))
    throw new Error(`unexpected fetch in the base-image bump test: ${url}`)

  const results = JSON.parse(readFileSync(fixture, 'utf8'))

  return {
    ok: true,
    status: 200,
    json: async () => ({ results, next: null })
  }
}
