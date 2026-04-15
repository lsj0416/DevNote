const GITHUB_REPO_URL_PATTERN = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/

export function validateGitHubRepoUrl(repoUrl: string) {
  const normalizedRepoUrl = repoUrl.trim()

  if (!normalizedRepoUrl) {
    return 'GitHub repo URL을 입력해주세요.'
  }

  if (!GITHUB_REPO_URL_PATTERN.test(normalizedRepoUrl)) {
    return '유효한 GitHub repo URL 형식이 아닙니다.'
  }

  return null
}
