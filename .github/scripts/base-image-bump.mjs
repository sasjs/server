#!/usr/bin/env node
/**
 * Finds the newest Cloudron node base image in the major this repository pins,
 * and reports whether `container/Dockerfile` is behind it.
 *
 * The base image is pinned by tag AND digest so a build is reproducible, which
 * means the OS-layer packages it carries only move when someone bumps the pin
 * deliberately. Cloudron republishes the image monthly with the security
 * updates of the day, and every day in between adds CVEs to the snapshot the
 * image was built from - which is what the container's Trivy OS gate reports.
 *
 * This script only READS the registry and the Dockerfile unless `--write` is
 * passed, so it is safe to run anywhere. The workflow that calls it decides
 * whether to open a pull request.
 *
 * Usage:
 *   node .github/scripts/base-image-bump.mjs [--write] [--tag <tag>]
 *
 * `--write` rewrites the FROM line when the pin is behind. `--tag` pins a
 * candidate explicitly, which is how the script is tested without waiting for
 * Cloudron to publish.
 *
 * Prints `stale=<bool>`, `currentTag=`, `currentDigest=`, `nextTag=` and
 * `nextDigest=`, and appends the same lines to $GITHUB_OUTPUT when set.
 */
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const DOCKERFILE = path.join(ROOT, 'container', 'Dockerfile')
const REGISTRY = 'cloudron/node-base'
const ARCHITECTURE = 'amd64'
const PIN = /^FROM\s+(cloudron\/node-base):([^@\s]+)@(sha256:[0-9a-f]{64})\s*$/m

const args = process.argv.slice(2)
const write = args.includes('--write')
const tagIndex = args.indexOf('--tag')
const chosenTag = tagIndex === -1 ? null : args[tagIndex + 1]

const current = (() => {
  const match = PIN.exec(readFileSync(DOCKERFILE, 'utf8'))
  if (!match) {
    console.error('could not read the base image pin from container/Dockerfile')
    process.exit(1)
  }

  return { image: match[1], tag: match[2], digest: match[3] }
})()

/** The node major is the leading `24` in `24-20261021`; only its dates move. */
const major = current.tag.split('-')[0]

const fetchTags = async () => {
  const tags = []
  let page = 1

  for (;;) {
    const url = `https://hub.docker.com/v2/repositories/${REGISTRY}/tags?page_size=100&page=${page}&ordering=last_updated`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`docker hub answered ${response.status} for ${url}`)
    }

    const body = await response.json()
    tags.push(...(body.results ?? []))
    if (!body.next) return tags
    page += 1
  }
}

const digestOf = (tag) =>
  (tag.images ?? []).find((image) => image.architecture === ARCHITECTURE)?.digest ?? null

const newest = async () => {
  const shape = new RegExp(`^${major}-\\d{8}$`)
  const candidates = (await fetchTags()).filter((tag) => shape.test(tag.name))
  if (!candidates.length) {
    throw new Error(`no ${major}-YYYYMMDD tag found for ${REGISTRY}`)
  }

  // The date is in the tag, so the tag string orders correctly.
  candidates.sort((a, b) => b.name.localeCompare(a.name))
  const tag = chosenTag ? candidates.find((c) => c.name === chosenTag) : candidates[0]
  if (!tag) throw new Error(`${chosenTag} is not a ${major}-YYYYMMDD tag for ${REGISTRY}`)

  return { tag: tag.name, digest: digestOf(tag) ?? current.digest }
}

const main = async () => {
  const next = await newest()
  const stale = next.tag !== current.tag || next.digest !== current.digest

  console.log(`pinned:  ${current.tag}@${current.digest}`)
  console.log(`newest:  ${next.tag}@${next.digest}`)
  console.log(`stale:   ${stale}`)

  if (stale && write) {
    const text = readFileSync(DOCKERFILE, 'utf8').replace(
      PIN,
      `FROM ${current.image}:${next.tag}@${next.digest}`
    )
    writeFileSync(DOCKERFILE, text)
    console.log(`rewrote the FROM line in container/Dockerfile`)
  }

  if (process.env.GITHUB_OUTPUT) {
    const lines = [
      `stale=${stale}`,
      `currentTag=${current.tag}`,
      `currentDigest=${current.digest}`,
      `nextTag=${next.tag}`,
      `nextDigest=${next.digest}`
    ]
    appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`)
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
