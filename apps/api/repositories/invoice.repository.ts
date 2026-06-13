import { prisma } from '@/lib/prisma'
import type { InvoiceComputedData, InvoiceWithItems, PaginatedResult } from '@invoice/shared'

const includeItems = { items: true } as const

export const InvoiceRepository = {
  async findAll(userId: string): Promise<InvoiceWithItems[]> {
    return prisma.invoice.findMany({
      where: { userId },
      include: includeItems,
      orderBy: { createdAt: 'desc' },
    })
  },

  async findPaginated(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResult<InvoiceWithItems>> {
    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where: { userId },
        include: includeItems,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.invoice.count({ where: { userId } }),
    ])
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
  },

  async findById(id: string, userId: string): Promise<InvoiceWithItems | null> {
    return prisma.invoice.findUnique({
      where: { id, userId },
      include: includeItems,
    })
  },

  async create(userId: string, data: InvoiceComputedData): Promise<InvoiceWithItems> {
    return prisma.$transaction(async (tx) => {
      const last = await tx.invoice.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { number: true },
      })
      let nextNumber = 'FAC-001'
      if (last?.number) {
        const lastNum = parseInt(last.number.split('-')[1], 10)
        nextNumber = `FAC-${String(lastNum + 1).padStart(3, '0')}`
      }
      return tx.invoice.create({
        data: {
          number: nextNumber,
          date: new Date(data.date),
          dueDate: new Date(data.dueDate),
          status: data.status,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          clientAddress: data.clientAddress,
          issuerName: data.issuerName,
          issuerEmail: data.issuerEmail,
          issuerAddress: data.issuerAddress,
          taxRate: data.taxRate,
          subtotal: data.subtotal,
          tax: data.tax,
          total: data.total,
          notes: data.notes ?? null,
          userId,
          items: {
            create: data.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
            })),
          },
        },
        include: includeItems,
      })
    })
  },

  async update(id: string, userId: string, data: InvoiceComputedData): Promise<InvoiceWithItems> {
    return prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } })
      return tx.invoice.update({
        where: { id, userId },
        data: {
          date: new Date(data.date),
          dueDate: new Date(data.dueDate),
          status: data.status,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          clientAddress: data.clientAddress,
          issuerName: data.issuerName,
          issuerEmail: data.issuerEmail,
          issuerAddress: data.issuerAddress,
          taxRate: data.taxRate,
          subtotal: data.subtotal,
          tax: data.tax,
          total: data.total,
          notes: data.notes ?? null,
          items: {
            create: data.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
            })),
          },
        },
        include: includeItems,
      })
    })
  },

  async delete(id: string, userId: string): Promise<void> {
    await prisma.invoice.delete({ where: { id, userId } })
  },
}
