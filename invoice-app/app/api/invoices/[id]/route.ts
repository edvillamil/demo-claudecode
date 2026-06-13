import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { invoiceFormSchema } from '@/lib/schemas'
import { handleApiError } from '@/lib/errors'
import { successResponse, noContentResponse } from '@/lib/response'
import { getInvoiceById, updateInvoice, deleteInvoice } from '@/services/invoice.service'
import { verifyToken } from '@/lib/jwt'
import type { InvoiceInput } from '@/lib/types'

type Ctx = { params: Promise<{ id: string }> }

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

export async function GET(request: NextRequest, ctx: Ctx): Promise<Response> {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await ctx.params
    const invoice = await getInvoiceById(id, userId)
    return successResponse(invoice)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest, ctx: Ctx): Promise<Response> {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await ctx.params
    const body = await request.json()
    const parsed = invoiceFormSchema.parse(body)
    const invoice = await updateInvoice(id, userId, parsed as InvoiceInput)
    return successResponse(invoice)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx): Promise<Response> {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await ctx.params
    await deleteInvoice(id, userId)
    return noContentResponse()
  } catch (error) {
    return handleApiError(error)
  }
}
