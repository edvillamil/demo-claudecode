import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { invoiceFormSchema } from '@/lib/schemas'
import { handleApiError } from '@/lib/errors'
import { successResponse, createdResponse } from '@/lib/response'
import { getAllInvoices, getAllInvoicesPaginated, createInvoice } from '@/services/invoice.service'
import { verifyToken } from '@/lib/jwt'
import type { InvoiceInput } from '@/lib/types'

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

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

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const hasPage = searchParams.has('page') || searchParams.has('pageSize')

    if (!hasPage) {
      const invoices = await getAllInvoices(userId)
      return successResponse(invoices)
    }

    const { page, pageSize } = paginationSchema.parse({
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    })
    const result = await getAllInvoicesPaginated(userId, page, pageSize)
    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const parsed = invoiceFormSchema.parse(body)
    const invoice = await createInvoice(userId, parsed as InvoiceInput)
    return createdResponse(invoice)
  } catch (error) {
    return handleApiError(error)
  }
}
