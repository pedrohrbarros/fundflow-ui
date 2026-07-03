import { getAccessToken } from '@/lib/access-token'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

interface FetchOptions {
  method?: string
  body?: unknown
  searchParams?: Record<string, string>
}

export async function apiRequest<T>(
  path: string,
  options: FetchOptions = {}
): Promise<Response & { parsedData: T }> {
  const token = await getAccessToken()
  if (!token) {
    throw new Error('Unauthorized: missing access token')
  }

  const url = new URL(`${API_URL}/api/v1${path}`)
  if (options.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      url.searchParams.set(key, value)
    }
  }

  const response = await fetch(url.toString(), {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  const data = (await response.json()) as T
  return Object.assign(response, { parsedData: data })
}
