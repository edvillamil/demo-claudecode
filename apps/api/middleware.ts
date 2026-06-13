import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')
  return new TextEncoder().encode(secret)
}

// ---------------------------------------------------------------------------
// In-memory rate limiter (per IP, sliding window)
// Resets on server restart — suitable for single-process / dev/staging.
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number
  windowStart: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

const RATE_LIMIT_MAX = 5          // max attempts
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000  // 15 minutes

// Prune stale entries periodically so the Map doesn't grow unbounded
let lastPrune = Date.now()
function pruneStale() {
  const now = Date.now()
  if (now - lastPrune < 60_000) return
  lastPrune = now
  for (const [key, entry] of rateLimitStore) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(key)
    }
  }
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSecs: number } {
  pruneStale()
  const now = Date.now()
  const entry = rateLimitStore.get(ip)

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now })
    return { allowed: true, retryAfterSecs: 0 }
  }

  entry.count += 1

  if (entry.count > RATE_LIMIT_MAX) {
    const retryAfterSecs = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - entry.windowStart)) / 1000)
    return { allowed: false, retryAfterSecs }
  }

  return { allowed: true, retryAfterSecs: 0 }
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

const RATE_LIMITED_PATHS = ['/api/auth/login', '/api/auth/register']
const PUBLIC_API_PATHS = ['/api/auth']

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // Apply rate limiting only to auth endpoints
  if (RATE_LIMITED_PATHS.some((p) => pathname.startsWith(p))) {
    const ip = getClientIp(request)
    const { allowed, retryAfterSecs } = checkRateLimit(ip)

    if (!allowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta de nuevo más tarde.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSecs),
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
            'X-RateLimit-Window': '900',
          },
        },
      )
    }
  }

  // Public API routes pass through without JWT check
  if (!pathname.startsWith('/api/') || isPublicApi(pathname)) {
    return NextResponse.next()
  }

  // JWT verification for all other /api/* routes
  const token = request.cookies.get('auth_token')?.value ?? null

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await jwtVerify(token, getSecret(), { algorithms: ['HS256'] })
    return NextResponse.next()
  } catch {
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 })
  }
}

export const config = {
  matcher: ['/api/:path*'],
}
