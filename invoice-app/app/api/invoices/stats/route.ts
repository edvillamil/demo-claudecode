import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { handleApiError } from '@/lib/errors'
import { successResponse } from '@/lib/response'

async function getUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    if (!token) return null
    const payload = await verifyToken(token)
    return payload.sub
  } catch {
    return null
  }
}

export async function GET(): Promise<Response> {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [total, pagadas, aggregate] = await Promise.all([
      prisma.invoice.count({ where: { userId } }),
      prisma.invoice.count({ where: { userId, status: 'pagada' } }),
      prisma.invoice.aggregate({ where: { userId }, _sum: { total: true } }),
    ])

    return successResponse({
      total,
      pagadas,
      totalFacturado: aggregate._sum.total ?? 0,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
