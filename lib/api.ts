import { auth } from '@clerk/nextjs/server'

const API_URL = process.env.API_URL ?? 'http://localhost:8000'
const API_TOKEN = process.env.API_TOKEN ?? ''

interface FetchOptions {
  method?: string
  body?: unknown
  searchParams?: Record<string, string>
}

export async function apiRequest<T>(
  path: string,
  options: FetchOptions = {}
): Promise<Response & { parsedData: T }> {
  const { getToken } = await auth()
  const token = await getToken()

  const url = new URL(`${API_URL}/api/v1${path}`)
  if (options.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      url.searchParams.set(key, value)
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Api-Key': API_TOKEN,
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(url.toString(), {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  const data = await response.json() as T
  return Object.assign(response, { parsedData: data })
}
