'use client'

export function handleFetchResponse(response: Response) {
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }
  return response
}
