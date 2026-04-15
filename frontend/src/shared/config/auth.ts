export const ACCESS_TOKEN_STORAGE_KEY = 'devnote.accessToken'
export const REFRESH_TOKEN_STORAGE_KEY = 'devnote.refreshToken'
export const USER_STORAGE_KEY = 'devnote.user'

const DEFAULT_API_BASE_URL = 'http://localhost:8080/api/v1'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL

export const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_ORIGIN ?? new URL(API_BASE_URL).origin

export const GITHUB_LOGIN_URL = `${BACKEND_ORIGIN}/oauth2/authorization/github`
