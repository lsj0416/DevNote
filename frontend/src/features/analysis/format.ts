export function normalizeRepoUrl(repoUrl: string) {
  return repoUrl.trim().replace(/\/+$/, '')
}
