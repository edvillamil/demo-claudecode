import { InvoiceRepository } from '@/repositories/invoice.repository'
import type { InvoiceInput, InvoiceComputedData, InvoiceWithItems, PaginatedResult } from '@/lib/types'
import { NotFoundError } from '@/lib/errors'

const DEFAULT_PAGE_SIZE = 20

function computeTotals(data: InvoiceInput): InvoiceComputedData {
  const items = data.items.map((item) => ({
    ...item,
    total: item.quantity * item.unitPrice,
  }))
  const subtotal = items.reduce((s, i) => s + i.total, 0)
  const tax = subtotal * (data.taxRate / 100)
  return { ...data, items, subtotal, tax, total: subtotal + tax }
}

export async function getAllInvoices(userId: string): Promise<InvoiceWithItems[]> {
  return InvoiceRepository.findAll(userId)
}

export async function getAllInvoicesPaginated(
  userId: string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<PaginatedResult<InvoiceWithItems>> {
  return InvoiceRepository.findPaginated(userId, page, pageSize)
}

export async function getInvoiceById(id: string, userId: string): Promise<InvoiceWithItems> {
  const invoice = await InvoiceRepository.findById(id, userId)
  if (!invoice) {
    throw new NotFoundError(`Invoice with id "${id}" not found`)
  }
  return invoice
}

export async function createInvoice(userId: string, data: InvoiceInput): Promise<InvoiceWithItems> {
  return InvoiceRepository.create(userId, computeTotals(data))
}

export async function updateInvoice(
  id: string,
  userId: string,
  data: InvoiceInput,
): Promise<InvoiceWithItems> {
  await getInvoiceById(id, userId)
  return InvoiceRepository.update(id, userId, computeTotals(data))
}

export async function deleteInvoice(id: string, userId: string): Promise<void> {
  await getInvoiceById(id, userId)
  return InvoiceRepository.delete(id, userId)
}
