import { SignJWT, jwtVerify } from 'jose'
import type { NextRequest } from 'next/server'

const ALGORITHM = 'HS256'
const EXPIRY = '8h'

export interface JWTPayload {
  sub: string
  email: string
  name: string | null
  iat: number
  exp: number
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is not set')
  return new TextEncoder().encode(secret)
}

export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ email: payload.email, name: payload.name })
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALGORITHM] })
  return payload as unknown as JWTPayload
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7).trim()
  return token.length > 0 ? token : null
}

export function extractCookieToken(request: NextRequest): string | null {
  return request.cookies.get('auth_token')?.value ?? null
}
