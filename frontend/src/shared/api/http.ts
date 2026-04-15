import { API_BASE_URL } from '../config/auth'

type ApiSuccessResponse<T> = {
  success: true
  data: T
  message: string
}

type ApiErrorResponse = {
  success: false
  message: string
  code?: string
}

export class ApiError extends Error {
  code?: string
  status: number

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

export async function getJson<T>(path: string, accessToken: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: createJsonHeaders(accessToken),
  })

  const payload = (await response.json()) as ApiSuccessResponse<T> | ApiErrorResponse

  if (!response.ok || !payload.success) {
    throw new ApiError(
      payload.message ?? '요청 처리 중 오류가 발생했습니다.',
      response.status,
      'code' in payload ? payload.code : undefined,
    )
  }

  return payload.data
}

export async function postJson<TResponse, TRequest>(
  path: string,
  accessToken: string,
  body?: TRequest,
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: createJsonHeaders(accessToken),
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const payload = (await response.json()) as ApiSuccessResponse<TResponse> | ApiErrorResponse

  if (!response.ok || !payload.success) {
    throw new ApiError(
      payload.message ?? '요청 처리 중 오류가 발생했습니다.',
      response.status,
      'code' in payload ? payload.code : undefined,
    )
  }

  return payload.data
}

function createJsonHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }
}
