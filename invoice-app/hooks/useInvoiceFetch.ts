'use client'

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const mergedOptions: RequestInit = {
    ...options,
    credentials: 'same-origin',
    headers: {
      ...options?.headers,
    },
  }

  let res: Response
  try {
    res = await fetch(url, mergedOptions)
  } catch (err) {
    throw new ApiError('Error de red', `No se pudo conectar con el servidor: ${url}`, 0, err)
  }

  if (!res.ok) {
    let message = `Error ${res.status}: ${res.statusText}`
    try {
      const body = await res.json()
      if (typeof body?.error === 'string') message = body.error
    } catch {
      // ignore — body may not be JSON
    }
    throw new ApiError('Error del servidor', message, res.status)
  }

  // 204 No Content (e.g. DELETE) — nothing to parse
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as unknown as T
  }

  const json = await res.json()

  // Unwrap { data: T } envelope
  if (json !== null && typeof json === 'object' && 'data' in json) {
    return json.data as T
  }

  return json as T
}

export class ApiError extends Error {
  readonly status: number
  readonly cause?: unknown

  constructor(title: string, detail: string, status: number, cause?: unknown) {
    super(`[${status}] ${title}: ${detail}`)
    this.name = 'ApiError'
    this.status = status
    this.cause = cause
  }
}
