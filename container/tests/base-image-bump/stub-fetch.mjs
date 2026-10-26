/**
 * Stands in for the Docker Hub tag listing, so the bump script can be exercised
 * without the network and without depending on what Docker Hub happens to hold
 * today. Loaded with `node --import`, which runs before the script under test.
 *
 * FIXTURE_TAGS is a JSON file. It holds either the `results` array the Hub would
 * return, or `{ "pages": [[...], [...]] }` to answer page 1, page 2, ... with a
 * `next` link between them - the shape the script's pagination loop needs to be
 * exercised at all.
 */
import { readFileSync } from 'node:fs'

const fixture = process.env.FIXTURE_TAGS

const body = () => JSON.parse(readFileSync(fixture, 'utf8'))

globalThis.fetch = async (url) => {
  const target = String(url)

  if (!target.includes('/tags?'))
    throw new Error(`unexpected fetch in the base-image bump test: ${target}`)

  const parsed = body()

  if (!parsed.pages) return { ok: true, status: 200, json: async () => ({ results: parsed, next: null }) }

  const page = Number(new URL(target).searchParams.get('page') ?? '1')
  const results = parsed.pages[page - 1] ?? []
  const next = page < parsed.pages.length ? `?page=${page + 1}` : null

  return { ok: true, status: 200, json: async () => ({ results, next }) }
}
