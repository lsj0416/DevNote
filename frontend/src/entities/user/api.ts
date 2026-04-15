import type { User } from './model'
import { getJson } from '../../shared/api/http'

export function fetchMe(accessToken: string) {
  return getJson<User>('/users/me', accessToken)
}
