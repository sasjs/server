/**
 * Request headers for the GitHub REST API.
 *
 * api.github.com rate limits unauthenticated requests per source IP, and the
 * address a shared CI runner uses is easily exhausted by everything else on
 * the host. The macro download in scripts/downloadMacros.ts makes one such
 * call on every api build, so the limit reddens unrelated builds with a 403.
 * Sending a token raises the limit to the authenticated one.
 *
 * GITHUB_TOKEN is the variable GitHub Actions provides; GH_TOKEN is the one
 * the gh CLI reads, accepted so a local build can reuse an existing login.
 * With neither set, the request goes out anonymously - which still works until
 * the IP's budget is spent.
 */
export const githubApiHeaders = (): { [key: string]: string } => {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN

  return token ? { Authorization: `Bearer ${token}` } : {}
}
